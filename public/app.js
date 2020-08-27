const header = new Vue ({
  el: 'header',
  data: {
    colormode: false,
  },
  methods: {
    togglecolormode: function() {
      if(this.colormode) {
        document.documentElement.style.cssText = "--bg: #F7CCCC;";
      } else {
        document.documentElement.style.cssText = "--bg: black;";
      }
      this.colormode = !this.colormode;
    },
  },

})
const app = new Vue({
  el: '#app',
  data: {
    url: '',
    slug: '',
    passwd: '',
    error: '',
    formVisible: true,
    created: null,
    slugfocus: false,
    urlfocus: false,
  },
  methods: {
    async createUrl() {
      this.error = '';
      const response = await fetch('/url', {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
        },
        body: JSON.stringify({
          url: this.url,
          slug: this.slug || undefined,
        }),
      });
      if (response.ok) {
        const result = await response.json();
        // this.formVisible = false;
        this.created = `https://ortener.herokuapp.com/${result.slug}`;
      } else if (response.status === 429) {
        this.error = 'You are sending too many requests. Try again in 20 seconds.';
      } else {
        const result = await response.json();
        this.error = result.message;
      }
    },
  },
});
