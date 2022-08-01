export default {

	props: {
		show: {
			type: Boolean,
			default: false
		},
		// A public URL to the resource
		url: {
			type: String,
			required: true
		},
		// A title for the resource, if available
		title: {
			type: String,
			default: ""
		},
		// Any extra data that shall be passed for sharing (e.g. the STAC entity for jobs)
		extra: {
			type: Object,
			default: () => ({})
		},
		// The source, e.g. a Job or Service
		context: {
			type: Object,
			required: true
		},
		// The type of the source, e.g. `job` or `service`
		type: {
			type: String,
			required: true
		}
	}

}