/**
 * Mixin that watches the component's root element for size changes
 * and toggles a 'compact' class on the .sourceToolbar (ref="sourceToolbar")
 * to hide button text labels when there isn't enough horizontal space.
 */
export default {
	data() {
		return {
			toolbarResizeObserver: null,
			lastToolbarWidth: 0
		};
	},
	mounted() {
		this.$nextTick(() => {
			this.toolbarResizeObserver = new ResizeObserver(entries => {
				for (const entry of entries) {
					const width = entry.contentRect.width;
					if (Math.abs(width - this.lastToolbarWidth) > 1) {
						this.lastToolbarWidth = width;
						this.updateToolbarCompact();
					}
				}
			});
			this.toolbarResizeObserver.observe(this.$el);
		});
	},
	beforeDestroy() {
		if (this.toolbarResizeObserver) {
			this.toolbarResizeObserver.disconnect();
		}
	},
	methods: {
		updateToolbarCompact() {
			const toolbar = this.$refs.sourceToolbar;
			if (!toolbar) return;
			const header = toolbar.parentElement;
			if (!header) return;
			// Remove compact to show full text labels
			toolbar.classList.remove('compact');
			// Take toolbar out of flex flow to measure its natural intrinsic width
			toolbar.style.position = 'absolute';
			toolbar.style.visibility = 'hidden';
			void toolbar.offsetWidth;
			const naturalWidth = toolbar.offsetWidth;
			// Restore toolbar to flow
			toolbar.style.position = '';
			toolbar.style.visibility = '';
			void header.offsetWidth;
			// Calculate available width: header content area minus siblings (title)
			const headerStyle = getComputedStyle(header);
			const headerPadding = parseFloat(headerStyle.paddingLeft) + parseFloat(headerStyle.paddingRight);
			let siblingWidth = 0;
			for (const child of header.children) {
				if (child !== toolbar) {
					siblingWidth += child.offsetWidth;
				}
			}
			const availableWidth = header.clientWidth - headerPadding - siblingWidth;
			if (naturalWidth > availableWidth) {
				toolbar.classList.add('compact');
			}
		}
	}
};
