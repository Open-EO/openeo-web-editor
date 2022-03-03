export default {

	props: {
		show: {
			type: Boolean,
			default: false
		},
		publicUrl: {
			type: String,
			default: null
		},
		stac: {
			type: Object,
			required: true
		}
	},

	computed: {

	}


}