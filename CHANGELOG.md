# Changelog

## [0.8.1](https://github.com/paulbreuler/runi/compare/runi-v0.8.0...runi-v0.8.1) (2026-02-22)


### Bug Fixes

* **ci:** guard against Tauri version mismatch between Rust crate and npm package ([#156](https://github.com/paulbreuler/runi/issues/156)) ([4c18a04](https://github.com/paulbreuler/runi/commit/4c18a04157b0ecb3431ae1ee923f2c59d19f27cd))

## [0.8.0](https://github.com/paulbreuler/runi/compare/runi-v0.7.0...runi-v0.8.0) (2026-02-22)


### Features

* API tracking bootstrap — hexagonal spec pipeline ([#129](https://github.com/paulbreuler/runi/issues/129)) ([0d5c5ba](https://github.com/paulbreuler/runi/commit/0d5c5baa9fd37ecb489f7967c43c68f24f85d7c4))
* **canvas:** canvas architecture integration - merged worktrees ([#122](https://github.com/paulbreuler/runi/issues/122)) ([0df3fc9](https://github.com/paulbreuler/runi/commit/0df3fc9b54f00c8aa61f81e650b068bc59d777ad))
* **collection:** two-tier request system — save, move, copy ([#138](https://github.com/paulbreuler/runi/issues/138)) ([011e33b](https://github.com/paulbreuler/runi/commit/011e33bf6b58f35800580449f59974c68147a017))
* **demo:** import spec from URL, drift display, and body pre-population ([#148](https://github.com/paulbreuler/runi/issues/148)) ([2bef030](https://github.com/paulbreuler/runi/commit/2bef0307f754ddeb7d13f54303b751082f5862cc))
* **drift:** add drift review UI and MCP tools, simplify URL import ([#150](https://github.com/paulbreuler/runi/issues/150)) ([#152](https://github.com/paulbreuler/runi/issues/152)) ([75db829](https://github.com/paulbreuler/runi/commit/75db8292ac90ec5ab88af6c4d2147c1aa1375bee))
* **editor:** migrate CodeEditor to CodeMirror 6 ([9d0cd09](https://github.com/paulbreuler/runi/commit/9d0cd09c82f46cc515459bc8f9592a3b9cac6a6b))
* **environments:** named environments with spec-first URL resolution ([#149](https://github.com/paulbreuler/runi/issues/149)) ([22e9c5f](https://github.com/paulbreuler/runi/commit/22e9c5fd0a5f96d53cbd9b4e7f38963ed6946359))
* **intelligence:** adopt Intent UI patterns for AI-driven interactions ([#147](https://github.com/paulbreuler/runi/issues/147)) ([64e041f](https://github.com/paulbreuler/runi/commit/64e041f9060d40e99333c8756c9f59a1c7a12cc8))
* MCP server, event-driven collections, sidebar UX improvements ([#114](https://github.com/paulbreuler/runi/issues/114)) ([15f3b20](https://github.com/paulbreuler/runi/commit/15f3b2053aa883ad187a88dce8910d43a000f2a8))
* **mcp:** add MCP server infrastructure ([#112](https://github.com/paulbreuler/runi/issues/112)) ([eab22f0](https://github.com/paulbreuler/runi/commit/eab22f0342b15edf8fb724ac63933a21061f3f8c))
* **mcp:** real-time SSE streaming for canvas state sync ([#125](https://github.com/paulbreuler/runi/issues/125)) ([0bd32ef](https://github.com/paulbreuler/runi/commit/0bd32ef211352d45d5aafeb71edf70b03f540f25))
* **sidebar:** UX polish and collection CRUD management ([#136](https://github.com/paulbreuler/runi/issues/136)) ([a24b8c9](https://github.com/paulbreuler/runi/commit/a24b8c94a27df7e5b171bd5f93cf592f4787f92e))
* **ui:** AI activity indicators, MCP broadcast fix, and CRUD workflow ([#126](https://github.com/paulbreuler/runi/issues/126)) ([e770560](https://github.com/paulbreuler/runi/commit/e770560803384e4555da455d8298c475bb1fdc0c))
* **ui:** AI provenance UI with signal system, composite sidebar, and Zen design overhaul ([#116](https://github.com/paulbreuler/runi/issues/116)) ([1184654](https://github.com/paulbreuler/runi/commit/1184654bb2c379a67278131215484800c2a344ba))
* **ui:** complete plan 0018 agents 001/002/004/005 ([#119](https://github.com/paulbreuler/runi/issues/119)) ([4cd04a5](https://github.com/paulbreuler/runi/commit/4cd04a51e7473324098192a55efb150fff522007))
* **ui:** editor-centric multi-request tabs, sidebar divider, and MCP integration tests ([#117](https://github.com/paulbreuler/runi/issues/117)) ([15a4a09](https://github.com/paulbreuler/runi/commit/15a4a09ff50a82d457cba8ea2f82495f33196b52))


### Bug Fixes

* **canvas:** apply quality fixes from architecture refactor ([#124](https://github.com/paulbreuler/runi/issues/124)) ([021e8c2](https://github.com/paulbreuler/runi/commit/021e8c20a3fe7bcdeae8f54cce16ea1ea523d7a9))
* **canvas:** stabilize request context switching and tab reset behavior ([#146](https://github.com/paulbreuler/runi/issues/146)) ([95cc342](https://github.com/paulbreuler/runi/commit/95cc342ce367e4a40639742bb44d31477007fdbc))
* **editor:** CodeMirror theme, layout, and theme selection ([#140](https://github.com/paulbreuler/runi/issues/140)) ([4f8905a](https://github.com/paulbreuler/runi/commit/4f8905a5062492143c288629bc7ee9b314bdecf6))
* **editor:** complete CodeMirror 6 migration ([#137](https://github.com/paulbreuler/runi/issues/137)) ([1a0ecce](https://github.com/paulbreuler/runi/commit/1a0ecce7373bd55e8da66c9db4bb51c722bce1a7))
* **import:** detect duplicate spec imports and offer replace instead of creating duplicates ([#153](https://github.com/paulbreuler/runi/issues/153)) ([9b61936](https://github.com/paulbreuler/runi/commit/9b61936ad40f8225bc2efbc188c43677ae201553))
* **test:** update E2E tests for new sidebar width (300px) ([#115](https://github.com/paulbreuler/runi/issues/115)) ([e947bc3](https://github.com/paulbreuler/runi/commit/e947bc3c80ccce931e0da6eb1a6054afda8a16b2))
* **ui:** add hover highlight to Select items ([#144](https://github.com/paulbreuler/runi/issues/144)) ([cffbef1](https://github.com/paulbreuler/runi/commit/cffbef1c3fd61bdd7a3be19918d0452f0dfe52dd))
* **ui:** add nativeButton={true} to all Base UI Menu.Item components ([#154](https://github.com/paulbreuler/runi/issues/154)) ([8142a26](https://github.com/paulbreuler/runi/commit/8142a26c6bd6cac407c7c01337dba8c67033310a))
* **ui:** address PR review feedback on accessibility and test selectors ([#143](https://github.com/paulbreuler/runi/issues/143)) ([3178d17](https://github.com/paulbreuler/runi/commit/3178d171f01a15bff4f3802943f69a0a4c90cb50))
* **ui:** fix Select overlay, display name, and sidebar refresh ([#145](https://github.com/paulbreuler/runi/issues/145)) ([0656ee0](https://github.com/paulbreuler/runi/commit/0656ee00eb33878975655ad4e1f969f4dd9b4978))


### Documentation

* add multi-tool AI instructions and consolidate architecture patterns ([#118](https://github.com/paulbreuler/runi/issues/118)) ([9ccbcc9](https://github.com/paulbreuler/runi/commit/9ccbcc987c3f3c4b9eb456ee9fb299e7458ae22d))

## [Unreleased]

### Added
- Context-aware canvas architecture for multi-view support
- ContextBar with tab navigation and layout picker
- Layout system with preset and generic layouts
- RequestContext as pluggable context (first context)
- Popout window support for contexts
- Keyboard shortcuts: Cmd+[ (prev layout), Cmd+] (next layout), Cmd+1 (Request)

### Changed
- Request/Response view now rendered via canvas architecture
- ActionButtons moved from TitleBar to RequestCanvasToolbar
- TitleBar simplified to title + settings only

### Internal
- Canvas foundation: types, store, events, popout hook
- CanvasHost component for dynamic panel arrangement
- LayoutPicker component for layout selection
- ContextBar component for context tabs

## [0.7.0](https://github.com/paulbreuler/runi/compare/runi-v0.6.0...runi-v0.7.0) (2026-02-08)


### Features

* **commands:** add /impl-discipline skill and fix stale /pr references ([#107](https://github.com/paulbreuler/runi/issues/107)) ([e300677](https://github.com/paulbreuler/runi/commit/e300677a8b4f0e5725863f3798c9d76466628e83))


### Bug Fixes

* **ui:** perfect sidebar expansion, tooltips, and layout stability ([#108](https://github.com/paulbreuler/runi/issues/108)) ([13c2c4b](https://github.com/paulbreuler/runi/commit/13c2c4b50b68f181f7f090090795dd486930ff22))


### Refactoring

* **events:** use event bus for collection request selection ([#110](https://github.com/paulbreuler/runi/issues/110)) ([3ae1cb2](https://github.com/paulbreuler/runi/commit/3ae1cb23340b777468a3fa24ee546068b783fe1e))

## [0.6.0](https://github.com/paulbreuler/runi/compare/runi-v0.5.0...runi-v0.6.0) (2026-02-07)


### Features

* **collection:** Collection Format Types - collection domain schema ([#98](https://github.com/paulbreuler/runi/issues/98)) ([2794b78](https://github.com/paulbreuler/runi/commit/2794b78843cc9d8820e5694e167f6c3feb0f1bf9))
* **collections:** Update collections and add sample httpbin OpenAPI collection integration ([#99](https://github.com/paulbreuler/runi/issues/99)) ([29b3e81](https://github.com/paulbreuler/runi/commit/29b3e817735e4e32190484100e428412b4e9f764))
* **features:** feature flags system and require storybook tests in CI ([#100](https://github.com/paulbreuler/runi/issues/100)) ([647be76](https://github.com/paulbreuler/runi/commit/647be76886b8b8595744178515adee26042a4b29))
* **settings:** Settings Panel UI with tabs, search, and JSON mode ([#101](https://github.com/paulbreuler/runi/issues/101)) ([b34974b](https://github.com/paulbreuler/runi/commit/b34974b874ba5abba71c10d38032e14709e5a2a8))
* **settings:** wire settings panel entry and store stubs ([#102](https://github.com/paulbreuler/runi/issues/102)) ([b5ae4b9](https://github.com/paulbreuler/runi/commit/b5ae4b98e0dcaab732e4c60c5c11935b73365aac))
* **ui:** add Lucide icons to TimingTab and improve SettingsSection layout ([#105](https://github.com/paulbreuler/runi/issues/105)) ([e00f5ff](https://github.com/paulbreuler/runi/commit/e00f5ff4ef7b11a24054a2100328955dc9f1491c))


### Bug Fixes

* **ui:** normalize font sizes, hide teaser flags, and clean up settings ([#104](https://github.com/paulbreuler/runi/issues/104)) ([e0ce356](https://github.com/paulbreuler/runi/commit/e0ce356ba185b7b4a487e7a6a3bb3450228b3efa))


### Tests

* **console:** remove flaky row click selection tests ([#95](https://github.com/paulbreuler/runi/issues/95)) ([f4a088c](https://github.com/paulbreuler/runi/commit/f4a088c5c0666297b2815d68329226a34bf7b696))


### Documentation

* consolidate readme status and commit commands/skills as-is ([#97](https://github.com/paulbreuler/runi/issues/97)) ([7a25006](https://github.com/paulbreuler/runi/commit/7a2500618644e7399f01d118971e92d20bbc06d7))


### Style

* polish custom titlebar layout and focus behavior ([#106](https://github.com/paulbreuler/runi/issues/106)) ([5e81d9f](https://github.com/paulbreuler/runi/commit/5e81d9f835ea546dc59c1c8d6952e4079bf03506))

## [0.5.0](https://github.com/paulbreuler/runi/compare/runi-v0.4.0...runi-v0.5.0) (2026-01-31)


### Features

* **tauri,build:** modern DMG UI, Iced icons, bundle id, and build optimizations ([#89](https://github.com/paulbreuler/runi/issues/89)) ([c3241b1](https://github.com/paulbreuler/runi/commit/c3241b1acaadc8492b17af90f0e0c53086227c94))
* **ui:** migrate from Radix UI to Base UI primitives ([#91](https://github.com/paulbreuler/runi/issues/91)) ([f87c9a3](https://github.com/paulbreuler/runi/commit/f87c9a3b0aa70f32ca831394213343ca169cbb34))


### Bug Fixes

* **console:** one error per failed request and pretty-print JSON in args ([#92](https://github.com/paulbreuler/runi/issues/92)) ([add8070](https://github.com/paulbreuler/runi/commit/add80706be752e8e20a17a7f96c570bdfab710da))
* **console:** use aria-checked in ConsolePanel selection tests ([#94](https://github.com/paulbreuler/runi/issues/94)) ([44669d4](https://github.com/paulbreuler/runi/commit/44669d47e3ab7665ab29d0367354f91a6d829b3a))


### Chores

* **husky:** fast pre-commit + fix ConsolePanel expand test (fixes main CI) ([#93](https://github.com/paulbreuler/runi/issues/93)) ([2563533](https://github.com/paulbreuler/runi/commit/2563533b708c3c1257dfd3212a48605db472ee75))

## [0.4.0](https://github.com/paulbreuler/runi/compare/runi-v0.3.0...runi-v0.4.0) (2026-01-29)


### Features

* **assets:** add update visuals and limps MCP guidance ([#81](https://github.com/paulbreuler/runi/issues/81)) ([21d7f5d](https://github.com/paulbreuler/runi/commit/21d7f5d29512bc44e23894f8f4cee9ad515f4986))
* **theme:** standardize Radix UI token usage across components ([#80](https://github.com/paulbreuler/runi/issues/80)) ([a1fbc49](https://github.com/paulbreuler/runi/commit/a1fbc49626565c038505cba444578ffafbb2caa2))


### Bug Fixes

* **ci:** correct workflow_id case in release-please manual dispatch ([#83](https://github.com/paulbreuler/runi/issues/83)) ([a37fe54](https://github.com/paulbreuler/runi/commit/a37fe54ec5534aa51bf4ea7c95f6cc8174b82028))
* **readme:** update CI badge and add coverage, issues, PRs badges ([#82](https://github.com/paulbreuler/runi/issues/82)) ([df7eae5](https://github.com/paulbreuler/runi/commit/df7eae5373f61f3ab3e3aa387db00f20ed4ad5cc))
* **release:** simplify release workflow by removing skip-github-release ([#84](https://github.com/paulbreuler/runi/issues/84)) ([d12cd2e](https://github.com/paulbreuler/runi/commit/d12cd2ec48168e3bb434747d7f09be3d27edc504))


### Refactoring

* **release:** simplify workflow based on official release-please docs ([#86](https://github.com/paulbreuler/runi/issues/86)) ([27f3226](https://github.com/paulbreuler/runi/commit/27f32264894117c82f029ccd42ae85236402be8b))


### Chores

* **commands:** align planning workflow and review skills ([#88](https://github.com/paulbreuler/runi/issues/88)) ([acf0f6e](https://github.com/paulbreuler/runi/commit/acf0f6ea17036a5fdb85947d8cbee7d8a2be05b0))
* **deps:** migrate to unified radix-ui package ([#79](https://github.com/paulbreuler/runi/issues/79)) ([653949d](https://github.com/paulbreuler/runi/commit/653949d686422c128db5e3d65f0d33b13e4c1cdb))

## [0.3.0](https://github.com/paulbreuler/runi/compare/runi-v0.2.5...runi-v0.3.0) (2026-01-27)


### Features

* **theme:** integrate Radix UI Themes 3 token architecture ([#77](https://github.com/paulbreuler/runi/issues/77)) ([4a0596d](https://github.com/paulbreuler/runi/commit/4a0596db2e51d9482f8d84dfbee597828b8d6a24))
* **ui:** overhaul toast system with Radix primitives and unify panel ordering ([#78](https://github.com/paulbreuler/runi/issues/78)) ([b625ca7](https://github.com/paulbreuler/runi/commit/b625ca761ce3a6bc52f079ae243714a5a8d33ef6))


### Bug Fixes

* **release:** checkout commit SHA and ensure DMG artifacts are properly built ([#75](https://github.com/paulbreuler/runi/issues/75)) ([ff68630](https://github.com/paulbreuler/runi/commit/ff68630322d5a160076e33da0e78e17035321679))

## [0.2.5](https://github.com/paulbreuler/runi/compare/runi-v0.2.4...runi-v0.2.5) (2026-01-26)


### Bug Fixes

* **ci:** restore release job and migrate to limps CLI ([#73](https://github.com/paulbreuler/runi/issues/73)) ([b8c3a8a](https://github.com/paulbreuler/runi/commit/b8c3a8a5d121347873ab2738208dfb968900593c))

## [0.2.4](https://github.com/paulbreuler/runi/compare/runi-v0.2.3...runi-v0.2.4) (2026-01-25)


### Chores

* **release:** improve release artifact naming ([#71](https://github.com/paulbreuler/runi/issues/71)) ([a82f75e](https://github.com/paulbreuler/runi/commit/a82f75e1848fe5cb2aa66788f05828f64bb07065))

## [0.2.3](https://github.com/paulbreuler/runi/compare/runi-v0.2.2...runi-v0.2.3) (2026-01-25)


### Chores

* **ci:** exclude release-please files from formatting checks and fix Storybook visual tests ([#69](https://github.com/paulbreuler/runi/issues/69)) ([9ab2630](https://github.com/paulbreuler/runi/commit/9ab2630299305c0d50894e529e67b9234d83e438))

## [0.2.2](https://github.com/paulbreuler/runi/compare/runi-v0.2.1...runi-v0.2.2) (2026-01-25)


### Bug Fixes

* **ci:** run build/publish directly after release-please creates release ([#64](https://github.com/paulbreuler/runi/issues/64)) ([9c645c2](https://github.com/paulbreuler/runi/commit/9c645c2ba982b70d17201e7730fb4ebc7e6975ee))


### Chores

* remove duplicate release.yml workflow ([#67](https://github.com/paulbreuler/runi/issues/67)) ([ee35051](https://github.com/paulbreuler/runi/commit/ee3505198de9e52d8863d298ae92dcb81b352c89))

## [0.2.1](https://github.com/paulbreuler/runi/compare/runi-v0.2.0...runi-v0.2.1) (2026-01-25)


### Chores

* **format:** exclude CHANGELOG.md from format checks (auto-generated) ([#65](https://github.com/paulbreuler/runi/issues/65)) ([ad60600](https://github.com/paulbreuler/runi/commit/ad6060092be6a4013bc35a892d01d04e7576e3fd))

## [0.2.0](https://github.com/paulbreuler/runi/compare/runi-v0.1.0...runi-v0.2.0) (2026-01-25)

### Features

- **accessibility:** implement keyboard navigation, ARIA attributes, and focus management for DataGrid ([#24](https://github.com/paulbreuler/runi/issues/24)) ([44abdd9](https://github.com/paulbreuler/runi/commit/44abdd91124a530c934668bea906cba4bf093e3b))
- add new cursor session and first session basics images ([20b45c4](https://github.com/paulbreuler/runi/commit/20b45c4df0a7525bd68c811e39069fc748e0b38e))
- **datagrid:** add expanded panel tabs and row hover actions ([#41](https://github.com/paulbreuler/runi/issues/41)) ([55521fe](https://github.com/paulbreuler/runi/commit/55521fe88d786caac211fb5c045fe89250413017))
- **datagrid:** Expanded Panel with Tab Navigation - Agent 8 ([#28](https://github.com/paulbreuler/runi/issues/28)) ([328b0b2](https://github.com/paulbreuler/runi/commit/328b0b243d7d2675ed814adeadbafb67a84a8421))
- **datagrid:** overhaul data grid with VirtualDataGrid, SQLite storage, and enhanced panels ([#23](https://github.com/paulbreuler/runi/issues/23)) ([1b2f98c](https://github.com/paulbreuler/runi/commit/1b2f98c0e0f938cb6e12a628853f6ad931f60eba))
- **datagrid:** Row Interactions - click selection, double-click expansion, and hover states ([#35](https://github.com/paulbreuler/runi/issues/35)) ([8d26efd](https://github.com/paulbreuler/runi/commit/8d26efdc3a64b86f202b500455f583725eb4b08a))
- **datagrid:** Selection & Sorting - complete selection and sorting features ([#26](https://github.com/paulbreuler/runi/issues/26)) ([992ab35](https://github.com/paulbreuler/runi/commit/992ab3501a936d1a84605ac0e49707165232ad13))
- **datagrid:** sticky columns, row expansion, and column width fixes ([#40](https://github.com/paulbreuler/runi/issues/40)) ([f327ed4](https://github.com/paulbreuler/runi/commit/f327ed44121feb3fae43e9206440aaa63fb94318))
- **devops:** add startup measurement and automated release workflow ([#18](https://github.com/paulbreuler/runi/issues/18)) ([561305f](https://github.com/paulbreuler/runi/commit/561305fa5908184a70af9473447b97846d3ee621))
- **foundation:** layout foundation and tooling improvements ([#10](https://github.com/paulbreuler/runi/issues/10)) ([ead43e4](https://github.com/paulbreuler/runi/commit/ead43e41b93c4f67d14d0a43ae6d1a719fdb6828))
- **history:** add Network History Panel with DevTools-style UI ([#15](https://github.com/paulbreuler/runi/issues/15)) ([4d2c880](https://github.com/paulbreuler/runi/commit/4d2c88040cec9275305af4c21dcd344bc70f51cd))
- **http:** implement core HTTP execution pipeline ([e93c8c9](https://github.com/paulbreuler/runi/commit/e93c8c9047962bb9b835194eb659ccad761e3fe9))
- **http:** implement Phase 1 HTTP core with CI infrastructure ([#6](https://github.com/paulbreuler/runi/issues/6)) ([ec21cc4](https://github.com/paulbreuler/runi/commit/ec21cc4ee27cd0b7daa314e4dd2584b52b203d06))
- initialize Tauri 2.9.5 project with SvelteKit 2.49.4 and clean architecture ([63e5a43](https://github.com/paulbreuler/runi/commit/63e5a438eb95002dbb5770d514ad07f7b97111f5))
- initialize Tauri 2.9.5 project with SvelteKit 2.49.4 and clean architecture ([8d3c3f8](https://github.com/paulbreuler/runi/commit/8d3c3f81cd200286437acdbef8257ec1d723ba29))
- **layout:** default sidebar collapsed and storybook consolidation improvements ([#58](https://github.com/paulbreuler/runi/issues/58)) ([71b3ef0](https://github.com/paulbreuler/runi/commit/71b3ef0b55d4576057a62d3c75f27abe6e9c5725))
- **layout:** React migration with resizable layout system ([#12](https://github.com/paulbreuler/runi/issues/12)) ([83be1d0](https://github.com/paulbreuler/runi/commit/83be1d0623de6a20af35c146f4755759fda8e19b))
- **ralph:** add split prompts for Phase 1 foundation ([5de97a7](https://github.com/paulbreuler/runi/commit/5de97a77925d3e21e8b3d3fde87b3700792a47fd))
- **storybook:** add play functions to component stories for interaction testing ([#32](https://github.com/paulbreuler/runi/issues/32)) ([dac78c3](https://github.com/paulbreuler/runi/commit/dac78c3c8a3c2f132b9bf704382cdf5d75eacce7))
- **storybook:** add testing utilities, templates, and MCP integration ([#31](https://github.com/paulbreuler/runi/issues/31)) ([1a7a511](https://github.com/paulbreuler/runi/commit/1a7a51123d697489a666438fd60987baf2b62159))
- **storybook:** consolidate stories and reorganize by domain ([#57](https://github.com/paulbreuler/runi/issues/57)) ([3bf669e](https://github.com/paulbreuler/runi/commit/3bf669eb87fcecc02d1420f5b1296280baba1fb4))
- **storybook:** set up Storybook with Svelte CSF format and component stories ([#9](https://github.com/paulbreuler/runi/issues/9)) ([4f82b90](https://github.com/paulbreuler/runi/commit/4f82b90917dfb5a626d3619a313fc7f0cf3e1290))
- **storybook:** upgrade to 10.2.0 and set up testing infrastructure ([#30](https://github.com/paulbreuler/runi/issues/30)) ([0622661](https://github.com/paulbreuler/runi/commit/0622661905ca8eb98f56e46094fc366ad65bc6d1))
- **ui,metrics:** standardize empty states and add RAM monitoring with threshold alerts ([#59](https://github.com/paulbreuler/runi/issues/59)) ([b0f1a12](https://github.com/paulbreuler/runi/commit/b0f1a1255d7858fd08b956bc7924b25daf18c4c9))
- **ui:** Add DockablePanel horizontal scroll, ActionBar system, and SegmentedControl ([#22](https://github.com/paulbreuler/runi/issues/22)) ([3fe4802](https://github.com/paulbreuler/runi/commit/3fe4802336f14cafd81453eb4dbdd3bc6b2091d6))

### Bug Fixes

- add missing app.html template for SvelteKit ([698aef5](https://github.com/paulbreuler/runi/commit/698aef544115ba8229158bd870ad91d793027db5))
- add Tauri icon to repository ([a3c0e3f](https://github.com/paulbreuler/runi/commit/a3c0e3f2a2681f01a7944d82e6b9329bca69c3b3))
- **build:** add proper app icons and fix unused variable warnings ([d4f4d0c](https://github.com/paulbreuler/runi/commit/d4f4d0c618b01af8e69f1fcd151e0fd2fe421710))
- **build:** use 8-bit RGBA icons for macOS compatibility ([dfb4240](https://github.com/paulbreuler/runi/commit/dfb4240ceff8390c40db562c16d83db4fa71b3b4))
- **ci:** build frontend before Rust checks for Tauri context ([0decf28](https://github.com/paulbreuler/runi/commit/0decf28326292afc198902ee5c80a6bd579aa682))
- **ci:** gate release-please workflow on CI completion and add manual trigger ([#62](https://github.com/paulbreuler/runi/issues/62)) ([28e2eea](https://github.com/paulbreuler/runi/commit/28e2eea93cf61ff186864231c1808d89ae75c198))
- configure adapter-static with strict: false for Tauri build ([a86385f](https://github.com/paulbreuler/runi/commit/a86385f0361d6311e7d9925c1305a585a6784d3d))
- install Tauri Linux dependencies in CI ([571e05a](https://github.com/paulbreuler/runi/commit/571e05a558dbad8dce11b8e70876fd07de28357b))
- sort mod declarations alphabetically for cargo fmt ([b96ad87](https://github.com/paulbreuler/runi/commit/b96ad8726a8895973dfc6494a8058722f9e75eff))
- update copyright year to 2026 in README.md ([a28d333](https://github.com/paulbreuler/runi/commit/a28d333e27a7942578119c44f38ea77e83312b4f))

### Refactoring

- **justfile:** reorganize commands and enhance documentation ([0b3b933](https://github.com/paulbreuler/runi/commit/0b3b9335ca7a3f86bcd88786e42a8943757bcac6))
- **page:** simplify derived status color class logic ([fea8b1b](https://github.com/paulbreuler/runi/commit/fea8b1b7685ec99a75edf12cf402f39280a62204))
- **plans:** standardize naming conventions and improve agent close report formatting ([#27](https://github.com/paulbreuler/runi/issues/27)) ([db0ae70](https://github.com/paulbreuler/runi/commit/db0ae70f7b3aa66f57864412234107b6ab90b747))

### Documentation

- add CLAUDE.md for project guidance and coding standards ([ccc46bc](https://github.com/paulbreuler/runi/commit/ccc46bcc7e323424dd26ecf4f089ee16edc7f524))
- add Product Requirements Document for runi application ([bbc52e2](https://github.com/paulbreuler/runi/commit/bbc52e20727cf909ed0c7e8705bd6b2a8775f656))
- add pull request creation guidelines to enhance collaboration ([4cabf9b](https://github.com/paulbreuler/runi/commit/4cabf9ba21e233955a1c83f26ecac5701f7260c3))
- **assets:** add runi-head-2.svg logo file ([#14](https://github.com/paulbreuler/runi/issues/14)) ([22dec88](https://github.com/paulbreuler/runi/commit/22dec883c09612d6bebb22a55b9f242663564f4b))
- **commands:** integrate smart orchestration system (work, heal, --auto) ([#25](https://github.com/paulbreuler/runi/issues/25)) ([f340ad7](https://github.com/paulbreuler/runi/commit/f340ad78d743db328fa0a15ae5ffbb6529889ffe))
- Completely overhaul planning documentation based on research and feedback ([#11](https://github.com/paulbreuler/runi/issues/11)) ([b76b59c](https://github.com/paulbreuler/runi/commit/b76b59c5c320fb9235449a548afd709e201f9b72))
- enhance CLAUDE.md with comprehensive product vision and architecture details ([e6fc8ef](https://github.com/paulbreuler/runi/commit/e6fc8efa2e28d494862f5f629a306bcaabbf2c89))
- enhance project documentation and specifications for runi ([5099c86](https://github.com/paulbreuler/runi/commit/5099c865fb52bd47c1ff9191108a006db3990809))
- enhance project documentation for runi API client ([9fbe20d](https://github.com/paulbreuler/runi/commit/9fbe20d5de222300ed8d65dc8cd8c5a88fcf1fbd))
- **prd:** add comprehensive product documentation and specifications ([a51f0ce](https://github.com/paulbreuler/runi/commit/a51f0ce7b67712db0d575175446110c20e22e07c))
- **prompts:** enhance ralph prompts and project documentation ([02ec55d](https://github.com/paulbreuler/runi/commit/02ec55d7d41b567fd6033e155e677f787f39a905))
- **prompts:** enhance ralph prompts and rewrite PROMPT-1.5 ([#7](https://github.com/paulbreuler/runi/issues/7)) ([43ee3bb](https://github.com/paulbreuler/runi/commit/43ee3bb12a28f7a89a238c8de54cf65c1869daa3))
- **prompts:** rewrite PROMPT-1.5 for minimal shadcn-svelte setup ([6ab0440](https://github.com/paulbreuler/runi/commit/6ab04406fc471594ac7043c76bfbdd1a68d94bc9))
- **ralph:** update README for frankbria/ralph-claude-code CLI ([df560dc](https://github.com/paulbreuler/runi/commit/df560dc00b1669d722e05769893d1091a4ef0784))
- **readme:** align with CLAUDE.md and update logo ([#13](https://github.com/paulbreuler/runi/issues/13)) ([a73ba0c](https://github.com/paulbreuler/runi/commit/a73ba0c9f833074643a7ef758fb24dd3a87ded0e))
- remove Product Requirements Document for runi application ([17113a9](https://github.com/paulbreuler/runi/commit/17113a91e23bf2d2fb80da95c77db9f74012c25b))
- **storybook:** complete final stage of testing overhaul ([#33](https://github.com/paulbreuler/runi/issues/33)) ([e0abc77](https://github.com/paulbreuler/runi/commit/e0abc77871c1dcd1d890846a58c6e8e33f6a1a22))
- update project specifications and enhance [@fix](https://github.com/fix)\_plan.md ([1eeb79b](https://github.com/paulbreuler/runi/commit/1eeb79b8dcdfcb7755e3ae122713c2625db71bb4))
- update README with project context and OSS best practices ([2888ffd](https://github.com/paulbreuler/runi/commit/2888ffd068a36646ce07fcb0e5775d1dfd068666))

### Style

- format codebase with Prettier ([bc7a3b1](https://github.com/paulbreuler/runi/commit/bc7a3b17c293f4925c5b85b214ece5322dfc5467))
- format documentation with Prettier ([ef8753a](https://github.com/paulbreuler/runi/commit/ef8753ae9dea3d294463f68b52a82109992330c9))

### Chores

- add release-please manifest file ([#61](https://github.com/paulbreuler/runi/issues/61)) ([d63de9f](https://github.com/paulbreuler/runi/commit/d63de9f17d9609a9639464378961795ea30837c5))
- **assets:** update application icons and logo assets ([#17](https://github.com/paulbreuler/runi/issues/17)) ([05dcda1](https://github.com/paulbreuler/runi/commit/05dcda146a82f981874735ea816b8dae13197987))
- **ci:** add ESLint, Prettier, vitest, and justfile ([f3fd519](https://github.com/paulbreuler/runi/commit/f3fd519b3f2044559eee10d1932901aaef1214e5))
- **ci:** update GitHub Actions workflow ([8a6fbd9](https://github.com/paulbreuler/runi/commit/8a6fbd92c95d51ef94edd04073ebde5dae2bec60))
- **license:** Add Affero General Public License v3.0 ([#34](https://github.com/paulbreuler/runi/issues/34)) ([a374637](https://github.com/paulbreuler/runi/commit/a3746379b82b9e1983f51690a6d2f3ff68c67495))
- **license:** switch from AGPL-3.0 to MIT and add copyright headers ([#42](https://github.com/paulbreuler/runi/issues/42)) ([893f05b](https://github.com/paulbreuler/runi/commit/893f05bcd37acd5d8e54d4eab8b1d96e0ac7f0bb))
- **lint:** enable pedantic Clippy with nursery lints ([f9791e7](https://github.com/paulbreuler/runi/commit/f9791e764c0951405759d61141728213d9341276))

## [0.1.0] - 2026-01-23

### Initial Release

- Initial release of runi
