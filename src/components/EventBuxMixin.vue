<script>
import EventBus from '@openeo/vue-components/eventbus.js';

export default {
	data() {
		return {
			eventBusListeners: {}
		};
	},
	beforeDestroy() {
		for (var eventName in this.eventBusListeners) {
			EventBus.$off(eventName, this.eventBusListeners[eventName]);
		}
	},
	methods: {
		listen(eventName, callback) {
			if (this.eventBusListeners[eventName]) {
				EventBus.$off(eventName, callback);
			}
			EventBus.$on(eventName, callback);
			this.eventBusListeners[eventName] = callback;
		},
		emit() {
			EventBus.$emit(...arguments);
		}
	}
}
</script>