<template>
	<div v-if="show" class="row help">
		<i class="fas fa-exclamation-circle"></i>
		<span v-if="terms && privacy">By clicking the button below, you agree to our <a :href="terms.href" :title="terms.title" target="_blank">Terms of Service</a> and that you have read our <a :href="privacy.href" :title="privacy.title" target="_blank">Privacy Policy</a>.</span>
		<span v-else-if="terms">By clicking the button below, you agree to our <a :href="terms.href" :title="terms.title" target="_blank">Terms of Service</a>.</span>
		<span v-else-if="privacy">By clicking the button below, you agree that you have read our <a :href="privacy.href" :title="privacy.title" target="_blank">Privacy Policy</a>.</span>
	</div>
</template>

<script>
import Utils from '../utils';

export default {
	name: 'TermsOfServiceConsent',
	computed: {
		...Utils.mapGetters(['capabilities']),
		show() {
			return this.terms && this.privacy;
		},
		terms() {
			return this.getLinkForRel('terms-of-service');
		},
		privacy() {
			return this.getLinkForRel('privacy-policy');
		}
	},
	methods: {
		getLinkForRel(rel) {
			let links = this.capabilities.links().filter(l => l.rel === rel);
			if (links.length > 0) {
				return links[0];
			}
			else {
				return null;
			}
		}
	}
}
</script>