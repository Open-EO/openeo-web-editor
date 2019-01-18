<script>
export default {
	props: ['connection'],
	methods: {
		supports(feature) {
			return this.connection && this.connection.capabilitiesObject && this.connection.capabilitiesObject.hasFeature(feature);
		}
	}
}
</script>