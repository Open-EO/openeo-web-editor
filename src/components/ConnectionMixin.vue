<script>
export default {
	props: ['connection'],
	methods: {
		supports(feature) {
			return this.connection && this.connection.capabilities().hasFeature(feature);
		}
	}
}
</script>