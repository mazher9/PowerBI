// powerbiEmbed.js

// helper to load external scripts
function loadScript(src) {
  return new Promise((resolve, reject) => {
    const s = document.createElement('script');
    s.src = src;
    s.onload = resolve;
    s.onerror = reject;
    document.head.appendChild(s);
  });
}

(function() {
  // template for widget container
  const tpl = document.createElement('template');
  tpl.innerHTML = `
    <style>
      :host { display: block; width: 100%; height: 100%; }
      #reportContainer { width: 100%; height: 100%; }
    </style>
    <div id="reportContainer"></div>
  `;

  class PowerBIEmbedWidget extends HTMLElement {
    constructor() {
      super();
      this.attachShadow({ mode: 'open' }).appendChild(tpl.content.cloneNode(true));
      this.container = this.shadowRoot.getElementById('reportContainer');
    }

    static get observedAttributes() {
      return ['embedurl', 'accesstoken'];
    }

    attributeChangedCallback() {
      this.render();
    }

    async connectedCallback() {
      // load Power BI client SDK
      await loadScript('https://cdn.jsdelivr.net/npm/powerbi-client@2.19.0/dist/powerbi.min.js');
      this.render();
    }

    render() {
      if (!window.powerbi) return;

      // clear previous embed (if any)
      window.powerbi.reset(this.container);

      // read props
      const embedUrl = this.getAttribute('embedurl');
      const accessToken = this.getAttribute('accesstoken');

      if (!embedUrl || !accessToken) {
        console.warn('PowerBIEmbedWidget: missing embedUrl or accessToken');
        return;
      }

      // extract report ID from URL
      const match = embedUrl.match(/reports\/([^\/]+)/);
      const reportId = match ? match[1] : '';

      // configure embed
      const models = window['powerbi-client'].models;
      const config = {
        type: 'report',
        tokenType: models.TokenType.Embed,
        accessToken: accessToken,
        embedUrl: embedUrl,
        id: reportId,
        settings: {
          filterPaneEnabled: false,
          navContentPaneEnabled: true
        }
      };

      // perform embed
      window.powerbi.embed(this.container, config);
    }

    disconnectedCallback() {
      window.powerbi && window.powerbi.reset(this.container);
    }
  }

  customElements.define('com-sap-sample-powerbi-embed', PowerBIEmbedWidget);
})();
