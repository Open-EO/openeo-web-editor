# OIDC setup guidelines for usage with the Web Editor

The standard authentication mechanism in openEO is OpenID Connect (OIDC).
The openEO Web Editor, being a standard web application, uses the corresponding OIDC flows such as the
[Authorization Code Flow](https://openid.net/specs/openid-connect-core-1_0.html#CodeFlowAuth)
to authenticate the user.

To provide an optimal OIDC authentication user experience in the openEO Web Editor,
it is important for an openEO back-end to properly set up a couple of things:

- Determine what **OIDC provider(s)** to support.
  One can choose from existing OIDC provider services,
  or set up their own custom OIDC provider,
  (e.g. using [Keycloak](https://www.keycloak.org/)).

- For at least one (and preferably all) of the supported OIDC providers:
  create an OIDC client that can be used as the **default OIDC client**
  by users that do not manage their own OIDC client.

  How this OIDC client has to be configured practically,
  heavily depends on the OIDC provider,
  but here are some general guidelines and constraints
  for the OIDC client configuration:

  - (At least) support the **Authorization Code Flow** without client secrets
    (which is sometimes labeled as a "public client").
    Support for PKCE (Proof Key for Code Exchange) is recommended.

  - **Allow-list the proper redirect URIs** related to your openEO Web Editor deployment.

    For example, if you host the web editor at `https://editor.openeo.example.org/`,
    you should allow the redirect URI `https://editor.openeo.example.org`.

    Note that the redirect URIs should be allow-listed *without trailing slashes*.

    Make sure to cover all possible Web Editor domains you want to support with the client.
    For example, consider allow-listing:
    - `http://localhost:8080` for local development of the web editor
    - `https://editor.openeo.org` so that your back-end can be used with the official openEO Web Editor.

  - **Allow-list the proper origins** of your openEO Web Editor deployment.
    (In Keycloak based providers, this setting is typically called "Web Origins".)
    This ensures that the OIDC provider sets the proper **CORS headers**
    so that the openEO Web Editor web app can access the tokens after authentication.
    In the rare case that you host the web editor and the OIDC provider on the same domain,
    you probably don't have to allow-list any origins.

    For example, if you host the web editor at `https://openeo.example.org/editor`,
    you should allow the origin `https://openeo.example.org`.

    Note that an origin by definition is only scheme + domain and optionally a port.
    Don't include a path (like `/editor` in the example above),
    not even a trailing slash.

    As with the redirect URIs, consider including:
    - `http://localhost:8080`
    - `https://editor.openeo.org`

- Handle the `GET /credentials/oidc` endpoint in your openEO back-end,
  based on the OIDC providers and OIDC clients discussed above.

  Apart from the full details discussed
  in the [`GET /credentials/oidc` specification](https://api.openeo.org/#tag/Account-Management/operation/authenticate-oidc)
  consider these additional notes on the `default_clients` items:

  - Include the appropriate grant type under the `grant_types` field:
    - `authorization_code` for the Authorization Code Flow
    - `authorization_code+pkce` for the Authorization Code Flow with PKCE
    - `implicit` for the Implicit Flow (**discouraged**)
  - List the same redirect URIs discussed above again under the `redirect_urls` field.
    This listing allows the openEO Web Editor to hide authentication options
    that won't work because of the redirect URIs configuration.
