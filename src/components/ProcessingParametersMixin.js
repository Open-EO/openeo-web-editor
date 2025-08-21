import Utils from '../utils';

export default {
	computed: {
		...Utils.mapState(['processingParameters']),
		...Utils.mapGetters(['supportsBilling', 'supportsBillingPlans']),
	},
  methods: {
		addProcessingParameters(fields, type, values = {}) {
			const key = `create_${type}_parameters`;
			for (const field of this.processingParameters[key]) {
				const obj = {
					advanced: field.optional, // Show required properties not in advanced section
					label: field.name // avoid formatting the parameter name
				};
				if (typeof values[field.name] !== 'undefined') {
					obj.value = values[field.name];
				}
				const schema = Object.assign(obj, field);
				fields.push(schema);
			}
			return fields;
		},
		normalizeData(data, fields = []) {
			data = Object.assign({}, data);
			for (const field of fields) {
				if (!field) {
					continue;
				}
				const value = data[field.name];
				const defaultValue = field.default;
				if ((data.optional && Utils.equals(value, defaultValue)) || typeof value === 'undefined') {
					delete data[field.name];
				}
				if (defaultValue === null && typeof value === 'string' && value.trim().length === 0) {
					data[field.name] = null;
				}
			}
			return data;
		},
  }
};