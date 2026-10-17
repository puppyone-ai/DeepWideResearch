"""Run with python -m unittest discover -s tests -v (backend requirements installed)."""
import asyncio
import json
import os
import unittest
from types import SimpleNamespace
from unittest.mock import AsyncMock, patch

import aiohttp
from aiohttp import web

# Neither local .env files nor ambient search/model credentials belong in fixtures.
with patch.dict(os.environ, {}, clear=True), patch('dotenv.load_dotenv', return_value=False):
    from deep_wide_research import mcp_client, research_strategy
    from deep_wide_research.context_utils import (
        build_context_from_raw_notes, parallel_to_sources,
    )


SEARCH_RESULT = {
    'results': [{'url': 'https://example.org/research', 'title': 'Research source',
                 'excerpts': ['A useful fact.'], 'publish_date': '2026-01-02'}]
}
FETCH_RESULT = {
    'results': [{'url': 'https://example.org/details', 'title': 'Details',
                 'excerpts': ['More context.'], 'full_content': 'Complete page.'}]
}
TOOLS = [
    {'name': 'web_search', 'description': 'Search the web',
     'inputSchema': {'type': 'object', 'properties': {
         'objective': {'type': 'string'}, 'search_queries': {'type': 'array'}},
         'required': ['objective', 'search_queries']}},
    {'name': 'web_fetch', 'description': 'Fetch a page',
     'inputSchema': {'type': 'object', 'properties': {'urls': {'type': 'array'}},
                     'required': ['urls']}},
]
CFG = SimpleNamespace(research_model='scripted-test', research_model_max_tokens=1000,
                      max_react_tool_calls=3)


def tool_call(name, arguments):
    return '<tool_call>' + json.dumps({'tool': name, 'arguments': arguments}) + '</tool_call>'


class ParallelRuntimeTests(unittest.IsolatedAsyncioTestCase):
    async def asyncSetUp(self):
        self.env = patch.dict(os.environ, {}, clear=True)
        self.env.start()
        self.registry = mcp_client.MCPRegistry()
        self.requests = []
        self.response_mode = 'json'
        self.entered = asyncio.Event()
        self.sessions = []
        app = web.Application()
        app.router.add_post('/mcp', self.handle_request)
        self.runner = web.AppRunner(app)
        await self.runner.setup()
        site = web.TCPSite(self.runner, '127.0.0.1', 0)
        await site.start()
        self.url = 'http://127.0.0.1:' + str(site._server.sockets[0].getsockname()[1]) + '/mcp'
        self.assertEqual(self.registry.get('parallel').server_url, 'https://search.parallel.ai/mcp')
        self.registry.get('parallel').server_url = self.url
        self.registry_patch = patch.object(research_strategy, 'get_registry', return_value=self.registry)
        self.registry_patch.start()
        original = aiohttp.ClientSession

        def session_factory(*args, **kwargs):
            session = original(*args, **kwargs)
            self.sessions.append(session)
            return session

        self.session_patch = patch('aiohttp.ClientSession', side_effect=session_factory)
        self.session_patch.start()

    async def asyncTearDown(self):
        self.session_patch.stop()
        self.registry_patch.stop()
        await self.runner.cleanup()
        self.env.stop()
        self.assertTrue(all(s.closed for s in self.sessions))

    async def handle_request(self, request):
        payload = await request.json()
        self.requests.append((str(request.url), dict(request.headers), payload))
        self.entered.set()
        if self.response_mode == 'delay':
            await asyncio.sleep(0.2)
        if self.response_mode == 'http_error':
            return web.Response(status=429, text='rate limited')
        if self.response_mode == 'malformed':
            return web.Response(text='not JSON or SSE')
        if self.response_mode == 'rpc_error':
            data = {'error': {'code': -32602, 'message': 'Invalid arguments'}}
        elif payload['method'] == 'tools/list':
            data = {'result': {'tools': TOOLS}}
        elif self.response_mode == 'fetch_errors_structured':
            data = {'result': {'structuredContent': self.fetch_error_payload}}
        elif self.response_mode == 'fetch_errors_text':
            data = {'result': {'content': [{'type': 'text', 'text': json.dumps(self.fetch_error_payload)}]}}
        elif self.response_mode == 'tool_error':
            data = {'result': {'isError': True, 'content': [{'type': 'text', 'text': 'quota exceeded'}]}}
        else:
            result = SEARCH_RESULT if payload['params']['name'] == 'web_search' else FETCH_RESULT
            data = {'result': {'structuredContent': result,
                               'content': [{'type': 'text', 'text': json.dumps(result)}]}}
        data.update(jsonrpc='2.0', id=payload['id'])
        if self.response_mode == 'sse':
            # Include a notification, CRLF and multiline data before matching reply.
            text = ': heartbeat\r\n\r\ndata: {"method":"notice"}\r\n\r\nevent: message\r\n'
            text += '\r\n'.join('data: ' + line for line in json.dumps(data, indent=2).splitlines()) + '\r\n\r\n'
            return web.Response(text=text, content_type='text/event-stream')
        return web.json_response(data)

    async def test_fresh_default_dispatch_and_downstream_source_consumption(self):
        calls = [
            tool_call('web_search', {'objective': 'Research facts', 'search_queries': ['research facts'],
                                     'session_id': 'untrusted', 'model_name': 'untrusted'}),
            tool_call('web_fetch', {'urls': ['https://example.org/details']}),
        ]
        prompts = []

        async def scripted_model(**kwargs):
            prompts.append(json.loads(json.dumps(kwargs['messages'])))
            if len(prompts) == 1:
                return SimpleNamespace(content='\n'.join(calls))
            self.assertIn('A useful fact.', kwargs['messages'][-1]['content'])
            self.assertIn('Complete page.', kwargs['messages'][-1]['content'])
            return SimpleNamespace(content='Research complete.')

        with patch.object(research_strategy, 'chat_complete', side_effect=scripted_model):
            result = await research_strategy.run_research_llm_driven('Research facts', CFG)
        sources = result['contextjson']['sources']
        self.assertEqual([s['url'] for s in sources], [SEARCH_RESULT['results'][0]['url'], FETCH_RESULT['results'][0]['url']])
        self.assertEqual(sources[0]['publishedAt'], '2026-01-02')
        self.assertEqual(build_context_from_raw_notes(result['raw_notes']), result['contextjson'])
        description = research_strategy.build_mcp_tools_description(TOOLS)
        sample = research_strategy.parse_tool_calls(description)[0]
        self.assertIsInstance(sample['arguments']['search_queries'], list)
        self.assertEqual(len(self.requests), 3)  # discovery, search, fetch
        for url, headers, payload in self.requests:
            self.assertEqual(url, self.url)
            self.assertTrue(headers['User-Agent'].startswith('DeepWideResearch/0.1.0'))
            self.assertNotIn('Authorization', headers)
            if payload['method'] == 'tools/call':
                self.assertEqual(payload['params']['arguments']['model_name'], CFG.research_model)
                self.assertNotEqual(payload['params']['arguments']['session_id'], 'untrusted')
        session_ids = [p['params']['arguments']['session_id'] for _, _, p in self.requests if p['method'] == 'tools/call']
        self.assertEqual(session_ids[0], session_ids[1])
        self.assertEqual(len(session_ids[0]), 32)

    async def test_saved_credentials_preserve_incumbent_defaults(self):
        for keys, expected in [({'TAVILY_API_KEY': 'fixture'}, {'tavily': ['tavily_search']}),
                               ({'EXA_API_KEY': 'fixture'}, {'exa': ['web_search_exa']}),
                               ({'EXA_API_KEY': 'fixture', 'TAVILY_API_KEY': 'fixture'},
                                {'tavily': ['tavily_search'], 'exa': ['web_search_exa']})]:
            with self.subTest(keys=list(keys)), patch.dict(os.environ, keys):
                self.assertEqual(mcp_client.MCPRegistry().default_tools(), expected)
        self.registry.unregister('parallel')
        self.assertEqual(self.registry.default_tools(), {})

    async def test_explicit_empty_disabled_and_unavailable_do_not_fallback(self):
        for config in [{}, {'parallel': []}, {'missing': ['web_search']}, {'tavily': ['tavily_search']}]:
            with self.subTest(config=config), patch.object(research_strategy, 'chat_complete', new_callable=AsyncMock) as model:
                result = await research_strategy.run_research_llm_driven('Research', CFG, mcp_config=config)
                self.assertEqual(json.loads(result['raw_notes'])['error'], 'No tools available')
                model.assert_not_called()
        self.assertEqual(self.requests, [])

    async def test_explicit_override_and_tool_permissions(self):
        responses = [SimpleNamespace(content=tool_call('web_fetch', {'urls': ['https://example.org']})),
                     SimpleNamespace(content='Done')]
        with patch.dict(os.environ, {'TAVILY_API_KEY': 'fixture'}), patch.object(research_strategy, 'chat_complete', side_effect=responses):
            result = await research_strategy.run_research_llm_driven('Research', CFG, mcp_config={'parallel': ['web_search']})
        self.assertIn('not enabled', json.loads(result['raw_notes'])['tool_calls'][0]['result']['error'])
        self.assertEqual(len(self.requests), 1)  # discovery only, denied fetch never sent

    async def test_custom_server_with_overlapping_name_keeps_selection(self):
        self.registry.register(mcp_client.MCPServerConfig(
            name='custom', transport_type='http', server_url=self.url,
            headers={'User-Agent': 'CustomResearch/1.0'}))
        responses = [SimpleNamespace(content=tool_call('web_search', {'query': 'Custom facts'})),
                     SimpleNamespace(content='Done')]
        with patch.object(research_strategy, 'chat_complete', side_effect=responses):
            result = await research_strategy.run_research_llm_driven(
                'Research', CFG, mcp_config={'custom': ['web_search']})
        self.assertEqual(self.requests[-1][1]['User-Agent'], 'CustomResearch/1.0')
        self.assertEqual(self.requests[-1][2]['params']['arguments'], {'query': 'Custom facts'})
        self.assertEqual(json.loads(result['raw_notes'])['tool_calls'][0]['result']['structuredContent'], SEARCH_RESULT)

    async def test_explicit_incumbent_failure_does_not_call_parallel(self):
        self.registry.register(mcp_client.MCPServerConfig(
            name='tavily', transport_type='http', server_url=self.url))
        responses = [SimpleNamespace(content=tool_call('web_search', {})),
                     SimpleNamespace(content='Done')]
        with patch.object(research_strategy, 'chat_complete', side_effect=responses):
            result = await research_strategy.run_research_llm_driven(
                'Research', CFG, mcp_config={'tavily': ['web_search']})
        self.assertEqual(json.loads(result['raw_notes'])['tool_calls'][0]['result']['structuredContent'], SEARCH_RESULT)
        # The selected server owns the tool despite the overlapping name.
        self.assertEqual(self.requests[-1][2]['params']['arguments'], {})
        self.response_mode = 'http_error'
        with self.assertRaisesRegex(RuntimeError, '429'):
            await self.registry.collect_tools({'tavily': ['tavily_search']})
        self.assertEqual(len(self.requests), 3)

    async def test_fetch_augments_a_search_source_at_the_same_url(self):
        shared_fetch = {'results': [{**FETCH_RESULT['results'][0], 'url': SEARCH_RESULT['results'][0]['url']}]}
        prompts = []

        async def model(**kwargs):
            prompts.append(kwargs['messages'][-1]['content'])
            if len(prompts) == 1:
                return SimpleNamespace(content=tool_call('web_search', {'objective': 'Facts', 'search_queries': ['facts']}))
            if len(prompts) == 2:
                return SimpleNamespace(content=tool_call('web_fetch', {'urls': [SEARCH_RESULT['results'][0]['url']]}))
            self.assertIn('Complete page.', prompts[-1])
            return SimpleNamespace(content='Done')

        with patch.dict(FETCH_RESULT, shared_fetch), patch.object(research_strategy, 'chat_complete', side_effect=model):
            result = await research_strategy.run_research_llm_driven('Facts', CFG)
        self.assertEqual(len(result['contextjson']['sources']), 1)
        self.assertIn('A useful fact.', result['contextjson']['sources'][0]['text'])
        self.assertIn('Complete page.', result['contextjson']['sources'][0]['text'])
        self.assertEqual(build_context_from_raw_notes(result['raw_notes']), result['contextjson'])

    async def test_sse_discovery_and_call_preserve_content(self):
        self.response_mode = 'sse'
        tools, clients = await self.registry.collect_tools({'parallel': ['web_search']})
        self.assertEqual([t['name'] for t in tools], ['web_search'])
        raw = await clients[0].call_tool('web_search', {'objective': 'Facts', 'search_queries': ['facts']})
        self.assertEqual(parallel_to_sources(raw, 'Facts')[0]['text'], 'A useful fact.')
        await clients[0].close()

    async def test_http_rpc_and_malformed_errors_are_failures(self):
        client = await self.registry.create_client('parallel')
        for mode, message in [('http_error', '429'), ('rpc_error', 'Invalid arguments'), ('malformed', 'No matching MCP response')]:
            self.response_mode = mode
            with self.subTest(mode=mode), self.assertRaisesRegex(RuntimeError, message):
                await client.call_tool('web_search', {})
        await client.close()

    async def test_provider_and_tool_errors_reach_model_without_fallback(self):
        for mode in ['http_error', 'rpc_error', 'tool_error']:
            self.response_mode = 'json'
            prompts = []

            async def scripted_model(**kwargs):
                prompts.append(kwargs['messages'][-1]['content'])
                if len(prompts) == 1:
                    self.response_mode = mode
                    return SimpleNamespace(content=tool_call('web_search', {'objective': 'Facts', 'search_queries': ['facts']}))
                self.assertIn('TOOL_ERRORS', prompts[-1])
                return SimpleNamespace(content='Search unavailable.')

            with self.subTest(mode=mode), patch.object(research_strategy, 'chat_complete', side_effect=scripted_model):
                result = await research_strategy.run_research_llm_driven('Facts', CFG)
                self.assertEqual(result['contextjson']['sources'], [])
        self.assertTrue(all(url == self.url for url, _, _ in self.requests))

    async def test_per_url_fetch_errors_reach_model_with_partial_results(self):
        error = {'url': 'https://example.org/missing', 'error_type': 'http_error',
                 'http_status_code': 404, 'content': 'Page not found'}
        for encoding in ['structured', 'text']:
            for partial in [False, True]:
                payload = {'results': FETCH_RESULT['results'] if partial else [], 'errors': [error]}
                raw = ({'structuredContent': payload} if encoding == 'structured'
                       else {'content': [{'type': 'text', 'text': json.dumps(payload)}]})
                self.response_mode = 'fetch_errors_' + encoding
                self.fetch_error_payload = payload
                prompts = []

                async def scripted_model(**kwargs):
                    prompts.append(kwargs['messages'][-1]['content'])
                    if len(prompts) == 1:
                        return SimpleNamespace(content=tool_call('web_fetch', {'urls': [error['url']]}))
                    self.assertIn('<TOOL_ERRORS>', prompts[-1])
                    self.assertIn(error['url'], prompts[-1])
                    self.assertIn('404', prompts[-1])
                    self.assertIn('Page not found', prompts[-1])
                    if partial:
                        self.assertIn('Complete page.', prompts[-1])
                    return SimpleNamespace(content='Fetch failure understood.')

                with self.subTest(encoding=encoding, partial=partial), \
                     patch.object(research_strategy, 'chat_complete', side_effect=scripted_model):
                    result = await research_strategy.run_research_llm_driven('Fetch sources', CFG)
                    self.assertEqual(len(result['contextjson']['sources']), int(partial))
                    self.assertEqual(json.loads(result['raw_notes'])['tool_calls'][0]['result'], raw)

    async def test_timeout_is_bounded_and_cancellation_closes_sessions(self):
        self.response_mode = 'delay'
        client = await self.registry.create_client('parallel')
        original_timeout = aiohttp.ClientTimeout
        requested = []

        def short_timeout(**kwargs):
            requested.append(kwargs)
            return original_timeout(total=0.02, connect=0.01)

        with patch('aiohttp.ClientTimeout', side_effect=short_timeout):
            with self.assertRaises(asyncio.TimeoutError):
                await client.call_tool('web_search', {})
        self.assertEqual(requested, [{'total': 30, 'connect': 10}])
        self.entered.clear()
        task = asyncio.create_task(client.call_tool('web_fetch', {'urls': ['https://example.org']}))
        await self.entered.wait()
        task.cancel()
        with self.assertRaises(asyncio.CancelledError):
            await task
        await client.close()

    def test_normalizer_supports_text_only_and_rejects_error_and_unsafe_urls(self):
        raw = {'content': [{'type': 'text', 'text': json.dumps(SEARCH_RESULT)}]}
        self.assertEqual(len(parallel_to_sources(raw, 'Facts')), 1)
        self.assertEqual(parallel_to_sources({'isError': True, 'structuredContent': SEARCH_RESULT}, None), [])
        self.assertEqual(parallel_to_sources({'results': [{'url': 'javascript:alert(1)', 'excerpts': ['x']}]}, None), [])


class RequestModelTests(unittest.TestCase):
    def test_api_omitted_and_empty_selection_are_distinct(self):
        with patch.dict(os.environ, {}, clear=True), patch('dotenv.load_dotenv', return_value=False):
            from deep_wide_research.main import ResearchMessage
        self.assertIsNone(ResearchMessage(query='Facts').mcp)
        self.assertEqual(ResearchMessage(query='Facts', mcp={}).mcp, {})
        self.assertEqual(ResearchMessage(query='Facts', mcp={'parallel': ['web_search']}).mcp,
                         {'parallel': ['web_search']})


if __name__ == '__main__':
    unittest.main()
