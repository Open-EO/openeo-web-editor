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
		hasListener(eventName) {
			return !!this.eventBusListeners[eventName];
		},
		listen(eventName, callback) {
			this.unlisten(eventName);
			this.$root.$on(eventName, callback);
			this.eventBusListeners[eventName] = callback;
		},
		unlisten(eventName) {
			if (this.hasListener(eventName)) {
				this.$root.$off(eventName, this.eventBusListeners[eventName]);
				delete this.eventBusListeners[eventName];
			}
		},
		emit() {
			this.$root.$emit(...arguments);
		}
	}
}
</script>