<script>
import Utils from '../utils';

export default {
	computed: {
		...Utils.mapState('server', ['connection']),
		...Utils.mapGetters('server', ['supports'])
	}
}
</script>