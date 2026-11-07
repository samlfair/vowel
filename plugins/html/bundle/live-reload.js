(function () {
  'use strict';

  const empty = { path: null, markdown: null, settings: { path: "settings.md", markdown: null }, editor: false };
  let current = null;
  function seed() {
    if (current) return current
    const element = document.getElementById("vowel-source");
    try {
      current = element ? { ...empty, ...JSON.parse(element.textContent) } : { ...empty };
    } catch {
      current = { ...empty };
    }
    return current
  }
  function updateFromTarget(target) {
    const source = seed();
    if (typeof target.source === "string") source.path = target.source;
    if (typeof target.metadata?.markdown === "string") source.markdown = target.metadata.markdown;
  }

  function openSocket() {
    console.info("Socket opened");
    const socket = new WebSocket(`ws://${window.location.host}`);
    socket.addEventListener('open', () => {
      socket.send('opened');
    });
    socket.addEventListener("close", () => {
      console.info("Socket closed");
      socket.close();
      setTimeout(() => {
        console.info("socket closed refresh");
        location.reload();
      }, 1000);
    });
    function isOpen() {
      return socket.readyState === 1
    }
    socket.addEventListener('message', e => {
      if (!isOpen()) return
      const target = JSON.parse(e.data);
      if (target.extension !== ".html") {
        retryImages("/" + target.path);
        return
      }
      const regex = new RegExp(window.location.pathname + "(index)?(\\.html)");
      if (!("/" + target.path).match(regex)) return
      updateFromTarget(target);
      if (!target.data) {
        location.reload();
        return
      }
      const next = new DOMParser().parseFromString(target.data, "text/html");
      patchHead(document.head, next.head);
      patchBody(document.body, next.body);
    });
  }
  function patchHead(head, nextHead) {
    const nextTitle = nextHead.querySelector("title");
    if (nextTitle && document.title !== nextTitle.textContent) document.title = nextTitle.textContent;
    const isTitle = element => element.tagName === "TITLE";
    const remaining = new Map();
    for (const element of head.children) {
      if (isTitle(element)) continue
      const key = element.outerHTML;
      if (!remaining.has(key)) remaining.set(key, []);
      remaining.get(key).push(element);
    }
    const keep = new Set();
    const pending = [];
    const place = (clone, before) => {
      before ? head.insertBefore(clone, before) : head.appendChild(clone);
      keep.add(clone);
    };
    for (const element of nextHead.children) {
      if (isTitle(element)) continue
      const matches = remaining.get(element.outerHTML);
      const existing = matches && matches.shift();
      if (existing) {
        pending.forEach(clone => place(clone, existing));
        pending.length = 0;
        keep.add(existing);
        continue
      }
      pending.push(document.importNode(element, true));
    }
    pending.forEach(clone => place(clone, null));
    for (const element of [...head.children]) {
      if (isTitle(element) || keep.has(element)) continue
      element.remove();
    }
  }
  function patchBody(body, nextBody) {
    const editing = document.documentElement.dataset.vowelEditing === "true";
    const keyOf = element => element.id ? `${element.tagName}#${element.id}` : element.tagName;
    const incoming = [...nextBody.children].filter(wasProduced);
    const produced = new Set(incoming.map(keyOf));
    const current = new Map();
    for (const element of body.children) {
      if (!wasProduced(element)) continue
      const key = keyOf(element);
      if (produced.has(key) && !current.has(key)) current.set(key, element);
    }
    const placed = new Set();
    let cursor = null;
    for (const element of incoming) {
      const key = keyOf(element);
      const existing = current.get(key);
      if (existing && editing && existing.tagName === "MAIN") {
        placed.add(existing);
        cursor = existing;
        continue
      }
      const fresh = document.importNode(element, true);
      if (existing) {
        existing.replaceWith(fresh);
      } else if (cursor) {
        cursor.after(fresh);
      } else {
        body.prepend(fresh);
      }
      placed.add(fresh);
      cursor = fresh;
    }
    for (const [, element] of current) {
      if (!placed.has(element) && element.isConnected) element.remove();
    }
    for (const element of [...body.children]) {
      if (!produced.has(keyOf(element)) && wasProduced(element)) element.remove();
    }
  }
  function retryImages(url) {
    const failed = [...document.images].filter(img => img.complete && img.naturalWidth === 0);
    const elements = failed.map(img => img.parentElement?.tagName === "PICTURE" ? img.parentElement : img);
    const naming = elements.filter(element => urlsOf(element).includes(url));
    for (const element of naming) element.replaceWith(element.cloneNode(true));
  }
  function urlsOf(element) {
    const nodes = [element, ...element.querySelectorAll("source, img")];
    return nodes.flatMap(node => {
      const candidates = (node.getAttribute("srcset") ?? "").split(",").map(candidate => candidate.trim().split(/\s+/)[0]);
      return [node.getAttribute("src"), ...candidates].filter(Boolean)
    })
  }
  function wasProduced(element) {
    if (element.tagName === "SCRIPT") return false
    if (element.hasAttribute("data-vowel-client")) return false
    return ["HEADER", "MAIN", "ASIDE", "FOOTER", "NAV"].includes(element.tagName) || Boolean(element.id)
  }

  openSocket();

})();
