export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    if (url.pathname === "/auth") {
      const githubAuthUrl = new URL("https://github.com/login/oauth/authorize");
      githubAuthUrl.searchParams.set("client_id", env.OAUTH_CLIENT_ID);
      githubAuthUrl.searchParams.set("scope", "repo,user");
      githubAuthUrl.searchParams.set("redirect_uri", `${url.origin}/callback`);
      return Response.redirect(githubAuthUrl.toString(), 302);
    }

    if (url.pathname === "/callback") {
      const code = url.searchParams.get("code");
      if (!code) {
        return new Response("Faltou o parametro 'code'", { status: 400 });
      }

      const tokenResp = await fetch("https://github.com/login/oauth/access_token", {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify({
          client_id: env.OAUTH_CLIENT_ID,
          client_secret: env.OAUTH_CLIENT_SECRET,
          code,
        }),
      });
      const tokenData = await tokenResp.json();

      if (tokenData.error) {
        return new Response("Erro na autenticacao: " + tokenData.error_description, { status: 400 });
      }

      const payload = JSON.stringify({ token: tokenData.access_token, provider: "github" });
      const html = `<!DOCTYPE html><html><body>
<script>
(function() {
  function receiveMessage(e) {
    window.opener.postMessage(
      'authorization:github:success:' + ${JSON.stringify(payload)},
      e.origin
    );
    window.removeEventListener("message", receiveMessage, false);
  }
  window.addEventListener("message", receiveMessage, false);
  window.opener.postMessage("authorizing:github", "*");
})();
</script>
</body></html>`;
      return new Response(html, { headers: { "Content-Type": "text/html" } });
    }

    return new Response("Not found", { status: 404 });
  },
};
