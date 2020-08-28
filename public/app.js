const app = new Vue({
  el: '#app',
  data: {
    url: '',
    slug: '',
    error: '',
    formVisible: true,
    created: null,
    slugfocus: false,
    urlfocus: false,
    passwdfocus: false,
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
          passwd: this.passwd || undefined,
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

let colormode = false;
function togglecolormode() {
  if(colormode) {
    document.documentElement.style.cssText = "--bg: #F7CCCC;";
    document.getElementsByClassName('lightoggle')[0].textContent = "Go Black"
  } else {
    document.documentElement.style.cssText = "--bg: black;";
    document.getElementsByClassName('lightoggle')[0].textContent = "Go Pink"
  }
  colormode = !colormode;
}
