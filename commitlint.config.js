export default {
	extends: ['@commitlint/config-conventional'],
	rules: {
		'type-enum': [
			2,
			'always',
			['feat', 'fix', 'docs', 'style', 'refactor', 'perf', 'test', 'chore', 'revert']
		],
		'scope-enum': [
			1,
			'always',
			['core', 'ui', 'api', 'cli', 'db', 'realtime', 'kanban', 'metrics', 'gantt', 'terminal']
		]
	}
};
