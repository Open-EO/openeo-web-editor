<script>
import Utils from '../utils';

export default {
	computed: {
		...Utils.mapState(['connection']),
		...Utils.mapGetters(['supports', 'apiVersion'])
	}
}
</script>