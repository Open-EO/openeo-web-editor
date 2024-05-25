export default {
  methods: {
		getTitleField(value = null) {
			return {
				name: 'title',
				label: 'Title',
				schema: {type: 'string'},
				default: null,
				value: value,
				optional: true
			};
		},
		getDescriptionField(value = null) {
			return {
				name: 'description',
				label: 'Description',
				schema: {type: 'string', subtype: 'commonmark'},
				default: null,
				value: value,
				description: 'CommonMark (Markdown) is allowed.',
				optional: true
			};
		},
		getLogLevelField(value = undefined) {
			return {
				name: 'log_level',
				label: 'Log level',
				schema: {type: 'string', enum: ['debug', 'info', 'warning', 'error']},
				default: 'info',
				value: value,
				description: 'The minimum severity level for log entries that the back-end stores for the processing request.\n\ndebug (all logs) > info > warning > error (only errors)',
				optional: true
			};
		},
		getBillingPlanField(value = undefined) {
			return {
				name: 'plan',
				label: 'Billing plan',
				schema: {type: 'string', subtype: 'billing-plan'},
				value: value,
				optional: true
			};
		},
		getBudgetField(value = null) {
			return {
				name: 'budget',
				label: 'Budget limit',
				schema: {type: 'number', subtype: 'budget'},
				default: null,
				value: value,
				optional: true
			};
		}
  }
};