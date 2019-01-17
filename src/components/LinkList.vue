<template>
	<ul class="link-list">
		<li v-for="(link, key) in links" :key="key">
			<a :href="link.href" target="_blank" :rel="link.rel">
				<template v-if="link.title">{{ link.title }}</template>
				<template v-else>{{ link.href }}</template>
			</a>
			<template v-if="link.rel"> ({{ link.rel }})</template>
		</li>
	</ul>
</template>

<script>
export default {
	name: 'LinkList',
	props: ['links']
}
</script>