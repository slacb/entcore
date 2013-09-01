package edu.one.core.auth;

import static edu.one.core.auth.oauth.OAuthAuthorizationResponse.code;
import static edu.one.core.auth.oauth.OAuthAuthorizationResponse.invalidRequest;
import static edu.one.core.auth.oauth.OAuthAuthorizationResponse.invalidScope;
import static edu.one.core.auth.oauth.OAuthAuthorizationResponse.serverError;
import static edu.one.core.auth.oauth.OAuthAuthorizationResponse.unauthorizedClient;

import java.io.UnsupportedEncodingException;
import java.net.URLDecoder;
import java.net.URLEncoder;
import java.util.Map;

import jp.eisbahn.oauth2.server.async.Handler;
import jp.eisbahn.oauth2.server.data.DataHandler;
import jp.eisbahn.oauth2.server.data.DataHandlerFactory;
import jp.eisbahn.oauth2.server.endpoint.ProtectedResource;
import jp.eisbahn.oauth2.server.endpoint.Token;
import jp.eisbahn.oauth2.server.endpoint.Token.Response;
import jp.eisbahn.oauth2.server.exceptions.OAuthError;
import jp.eisbahn.oauth2.server.exceptions.Try;
import jp.eisbahn.oauth2.server.fetcher.accesstoken.AccessTokenFetcherProvider;
import jp.eisbahn.oauth2.server.fetcher.accesstoken.impl.DefaultAccessTokenFetcherProvider;
import jp.eisbahn.oauth2.server.fetcher.clientcredential.ClientCredentialFetcher;
import jp.eisbahn.oauth2.server.fetcher.clientcredential.ClientCredentialFetcherImpl;
import jp.eisbahn.oauth2.server.granttype.GrantHandlerProvider;
import jp.eisbahn.oauth2.server.granttype.impl.DefaultGrantHandlerProvider;
import jp.eisbahn.oauth2.server.models.AuthInfo;
import jp.eisbahn.oauth2.server.models.Request;

import org.vertx.java.core.Vertx;
import org.vertx.java.core.VoidHandler;
import org.vertx.java.core.eventbus.Message;
import org.vertx.java.core.http.HttpServerRequest;
import org.vertx.java.core.http.RouteMatcher;
import org.vertx.java.core.json.JsonObject;
import org.vertx.java.platform.Container;

import edu.one.core.auth.oauth.HttpServerRequestAdapter;
import edu.one.core.auth.oauth.JsonRequestAdapter;
import edu.one.core.auth.oauth.OAuthDataHandler;
import edu.one.core.auth.oauth.OAuthDataHandlerFactory;
import edu.one.core.auth.users.DefaultUserAuthAccount;
import edu.one.core.auth.users.UserAuthAccount;
import edu.one.core.infra.Controller;
import edu.one.core.infra.MongoDb;
import edu.one.core.infra.Neo;
import edu.one.core.infra.request.CookieHelper;
import edu.one.core.infra.security.UserUtils;
import edu.one.core.infra.security.resources.UserInfos;
import edu.one.core.security.ActionType;
import edu.one.core.security.SecuredAction;

public class AuthController extends Controller {

	private final DataHandlerFactory oauthDataFactory;
	private final Token token;
	private final ProtectedResource protectedResource;
	private final UserAuthAccount userAuthAccount;
	private static final String USERINFO_SCOPE = "userinfo";

	public AuthController(Vertx vertx, Container container, RouteMatcher rm,
			Map<String, edu.one.core.infra.security.SecuredAction> securedActions) {
		super(vertx, container, rm, securedActions);
		Neo neo = new Neo(eb, log);
		this.oauthDataFactory = new OAuthDataHandlerFactory(
				neo,
				new MongoDb(eb, container.config()
						.getString("mongo.address", "wse.mongodb.persistor")));
		GrantHandlerProvider grantHandlerProvider = new DefaultGrantHandlerProvider();
		ClientCredentialFetcher clientCredentialFetcher = new ClientCredentialFetcherImpl();
		this.token = new Token();
		this.token.setDataHandlerFactory(oauthDataFactory);
		this.token.setGrantHandlerProvider(grantHandlerProvider);
		this.token.setClientCredentialFetcher(clientCredentialFetcher);
		AccessTokenFetcherProvider accessTokenFetcherProvider =
				new DefaultAccessTokenFetcherProvider();
		this.protectedResource = new ProtectedResource();
		this.protectedResource.setDataHandlerFactory(oauthDataFactory);
		this.protectedResource.setAccessTokenFetcherProvider(accessTokenFetcherProvider);
		this.userAuthAccount = new DefaultUserAuthAccount(vertx, container);
	}

	public void authorize(final HttpServerRequest request) {
		final String responseType = request.params().get("response_type");
		final String clientId = request.params().get("client_id");
		final String redirectUri = request.params().get("redirect_uri");
		final String scope = request.params().get("scope");
		final String state = request.params().get("state");
		if ("code".equals(responseType) && clientId != null && !clientId.trim().isEmpty()) {
			if (USERINFO_SCOPE.equals(scope)) {
				final DataHandler data = oauthDataFactory.create(new HttpServerRequestAdapter(request));
				data.validateClientById(clientId, new Handler<Boolean>() {

					@Override
					public void handle(Boolean clientValid) {
						if (Boolean.TRUE.equals(clientValid)) {
							UserUtils.getUserInfos(eb, request, new org.vertx.java.core.Handler<UserInfos>() {

								@Override
								public void handle(UserInfos user) {
									if (user != null && user.getUserId() != null) {
										((OAuthDataHandler) data).createOrUpdateAuthInfo(
												clientId, user.getUserId(), scope, redirectUri,
												new Handler<AuthInfo>() {

													@Override
													public void handle(AuthInfo auth) {
														if (auth != null) {
															code(request, redirectUri, auth.getCode(), state);
														} else {
															serverError(request, redirectUri, state);
														}
													}
												});
									} else {
										viewLogin(request, null, request.uri());
									}
								}
							});
						} else {
							unauthorizedClient(request, redirectUri, state);
						}
					}
				});
			} else {
				invalidScope(request, redirectUri, state);
			}
		} else {
			invalidRequest(request, redirectUri, state);
		}
	}

	public void token(final HttpServerRequest request) {
		request.expectMultiPart(true);
		request.endHandler(new VoidHandler() {

			@Override
			protected void handle() {
				Request req = new HttpServerRequestAdapter(request);
				token.handleRequest(req, new Handler<Response>() {

					@Override
					public void handle(Response response) {
						renderJson(request, new JsonObject(response.getBody()), response.getCode());
					}
				});
			}
		});
	}

	private void viewLogin(HttpServerRequest request, String error, String callBack) {
		JsonObject context = new JsonObject();
		if (callBack != null && !callBack.trim().isEmpty()) {
			try {
				context.putString("callBack", URLEncoder.encode(callBack, "UTF-8"));
			} catch (UnsupportedEncodingException e) {
				log.error(e.getMessage(), e);
			}
		}
		if (error != null && !error.trim().isEmpty()) {
			context.putObject("error", new JsonObject().putString("message", error));
		}
		renderView(request, context, "login.html", null);
	}

	public void login(HttpServerRequest request) {
		viewLogin(request, null, request.params().get("callBack"));
	}

	public void loginSubmit(final HttpServerRequest request) {
		request.expectMultiPart(true);
		request.endHandler(new VoidHandler() {
			@Override
			public void handle() {
				String c = request.formAttributes().get("callBack");
				final StringBuilder callBack = new StringBuilder();
				if (c != null && !c.trim().isEmpty()) {
					try {
						callBack.append(URLDecoder.decode(c,"UTF-8"));
					} catch (UnsupportedEncodingException ex) {
						log.error(ex.getMessage(), ex);
						callBack.append(container.config()
								.getObject("authenticationServer").getString("loginCallback"));
					}
				} else {
					callBack.append(container.config()
							.getObject("authenticationServer").getString("loginCallback"));
				}
				DataHandler data = oauthDataFactory.create(new HttpServerRequestAdapter(request));
				String login = request.formAttributes().get("email");
				String password = request.formAttributes().get("password");
				data.getUserId(login, password, new Handler<String>() {

					@Override
					public void handle(String userId) {
						if (userId != null && !userId.trim().isEmpty()) {
							UserUtils.createSession(eb, userId,
									new org.vertx.java.core.Handler<String>() {

								@Override
								public void handle(String sessionId) {
									if (sessionId != null && !sessionId.trim().isEmpty()) {
										CookieHelper.getInstance().setSigned("oneSessionId", sessionId,
												container.config().getLong("cookie_timeout", 1800L),
												request.response());
										redirect(request, callBack.toString(), "");
									} else {
										viewLogin(request, "auth.error.authenticationFailed", callBack.toString());
									}
								}
							});
						} else {
							viewLogin(request, "auth.error.authenticationFailed", callBack.toString());
						}
					}
				});

			}
		});
	}

	public void logout(final HttpServerRequest request) {
		String sessionId = CookieHelper.getInstance().getSigned("oneSessionId", request);
		String c = request.params().get("callback");
		final StringBuilder callback = new StringBuilder();
		if (c != null && !c.trim().isEmpty()) {
			try {
				callback.append(URLDecoder.decode(c, "UTF-8"));
			} catch (UnsupportedEncodingException e) {
				log.error(e.getMessage(), e);
				callback.append("/login");
			}
		} else {
			callback.append("/login");
		}
		UserUtils.deleteSession(eb, sessionId, new org.vertx.java.core.Handler<Boolean>() {

			@Override
			public void handle(Boolean deleted) {
				if (Boolean.TRUE.equals(deleted)) {
					CookieHelper.set("oneSessionId", "", 0l, request.response());
				}
				redirect(request, callback.toString(), "");
			}
		});
	}

	@SecuredAction(value = "userinfo", type = ActionType.RESOURCE)
	public void userInfo(final HttpServerRequest request) {
		UserUtils.getSession(eb, request, new org.vertx.java.core.Handler<JsonObject>() {

			@Override
			public void handle(JsonObject infos) {
				if (infos != null) {
					renderJson(request, infos);
				} else {
					unauthorized(request);
				}
			}
		});
	}

	public void oauthResourceServer(final Message<JsonObject> message) {
		if (message.body() == null) {
			message.reply(new JsonObject());
			return;
		}
		validToken(message);
	}

	private void validToken(final Message<JsonObject> message) {
		protectedResource.handleRequest(new JsonRequestAdapter(message.body()),
				new Handler<Try<OAuthError,ProtectedResource.Response>>() {

			@Override
			public void handle(Try<OAuthError, ProtectedResource.Response> resp) {
				ProtectedResource.Response response;
				try {
					response = resp.get();
					JsonObject r = new JsonObject()
					.putString("status", "ok")
					.putString("client_id", response.getClientId())
					.putString("remote_user", response.getRemoteUser())
					.putString("scope", response.getScope());
					message.reply(r);
				} catch (OAuthError e) {
					message.reply(new JsonObject().putString("error", e.getType()));
				}
			}
		});
	}

	public void activeAccount(HttpServerRequest request) {
		JsonObject json = new JsonObject();
		if (request.params().contains("activationCode")) {
			json.putString("activationCode", request.params().get("activationCode"));
		}
		renderView(request, json);
	}

	public void activeAccountSubmit(final HttpServerRequest request) {
		request.expectMultiPart(true);
		request.endHandler(new VoidHandler() {

			@Override
			protected void handle() {
				String login = request.formAttributes().get("login");
				final String activationCode = request.formAttributes().get("activationCode");
				String password = request.formAttributes().get("password");
				String confirmPassword = request.formAttributes().get("confirmPassword");
				if (login == null || activationCode == null|| password == null ||
						login.trim().isEmpty() || activationCode.trim().isEmpty() ||
						password.trim().isEmpty() || !password.equals(confirmPassword)) {
					JsonObject error = new JsonObject()
					.putObject("error", new JsonObject()
					.putString("message", "auth.activation.invalid.argument"));
					if (activationCode != null) {
						error.putString("activationCode", activationCode);
					}
					renderView(request, error);
				} else {
					userAuthAccount.activateAccount(login, activationCode, password,
							new org.vertx.java.core.Handler<Boolean>() {

						@Override
						public void handle(Boolean activated) {
							if (Boolean.TRUE.equals(activated)) {
								redirect(request, "/login");
							} else {
								JsonObject error = new JsonObject()
								.putObject("error", new JsonObject()
								.putString("message", "activation.error"));
								if (activationCode != null) {
									error.putString("activationCode", activationCode);
								}
								renderView(request, error);
							}
						}
					});
				}
			}
		});
	}

	public void forgotPassword(HttpServerRequest request) {
		renderView(request);
	}

	public void forgotPasswordSubmit(final HttpServerRequest request) {
		request.expectMultiPart(true);
		request.endHandler(new VoidHandler() {

			@Override
			protected void handle() {
				String login = request.formAttributes().get("login");
				if (login != null && !login.trim().isEmpty()) {
					userAuthAccount.forgotPassword(login, new org.vertx.java.core.Handler<Boolean>() {

						@Override
						public void handle(Boolean sent) {
							if (Boolean.TRUE.equals(sent)) {
								renderView(request, new JsonObject()
								.putString("message", "auth.resetCodeSent"), "message.html", null);
							} else {
								JsonObject error = new JsonObject()
								.putObject("error", new JsonObject()
								.putString("message", "forgot.error"));
								renderView(request, error);
							}
						}
					});
				} else {
					JsonObject error = new JsonObject()
					.putObject("error", new JsonObject()
					.putString("message", "forgot.error"));
					renderView(request, error);
				}
			}
		});
	}

	public void resetPassword(HttpServerRequest request) {
		renderView(request, new JsonObject()
		.putString("resetCode", request.params().get("resetCode")), "reset.html", null);
	}

	public void resetPasswordSubmit(final HttpServerRequest request) {
		request.expectMultiPart(true);
		request.endHandler(new VoidHandler() {

			@Override
			protected void handle() {
				String login = request.formAttributes().get("login");
				final String resetCode = request.formAttributes().get("resetCode");
				String password = request.formAttributes().get("password");
				String confirmPassword = request.formAttributes().get("confirmPassword");
				if (login == null || resetCode == null|| password == null ||
						login.trim().isEmpty() || resetCode.trim().isEmpty() ||
						password.trim().isEmpty() || !password.equals(confirmPassword)) {
					JsonObject error = new JsonObject()
					.putObject("error", new JsonObject()
					.putString("message", "auth.reset.invalid.argument"));
					if (resetCode != null) {
						error.putString("resetCode", resetCode);
					}
					renderView(request, error);
				} else {
					userAuthAccount.resetPassword(login, resetCode, password,
							new org.vertx.java.core.Handler<Boolean>() {

						@Override
						public void handle(Boolean reseted) {
							if (Boolean.TRUE.equals(reseted)) {
								redirect(request, "/login");
							} else {
								JsonObject error = new JsonObject()
								.putObject("error", new JsonObject()
								.putString("message", "reset.error"));
								if (resetCode != null) {
									error.putString("resetCode", resetCode);
								}
								renderView(request, error);
							}
						}
					});
				}
			}
		});
	}

}
