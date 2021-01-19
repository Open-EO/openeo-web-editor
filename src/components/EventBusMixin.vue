<script>
export default {
	data() {
		return {
			eventBusListeners: {}
		};
	},
	beforeDestroy() {
		for (var eventName in this.eventBusListeners) {
			this.$root.$off(eventName, this.eventBusListeners[eventName]);
		}
	},
	methods: {
		listen(eventName, callback) {
			if (this.eventBusListeners[eventName]) {
				this.$root.$off(eventName, callback);
			}
			this.$root.$on(eventName, callback);
			this.eventBusListeners[eventName] = callback;
		},
		emit() {
			this.$root.$emit(...arguments);
		}
	}
}
</script>