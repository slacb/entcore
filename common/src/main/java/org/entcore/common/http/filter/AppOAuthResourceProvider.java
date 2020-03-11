/*
 * Copyright © "Open Digital Education", 2017
 *
 * This program is published by "Open Digital Education".
 * You must indicate the name of the software and the company in any production /contribution
 * using the software and indicate on the home page of the software industry in question,
 * "powered by Open Digital Education" with a reference to the website: https://opendigitaleducation.com/.
 *
 * This program is free software, licensed under the terms of the GNU Affero General Public License
 * as published by the Free Software Foundation, version 3 of the License.
 *
 * You can redistribute this application and/or modify it since you respect the terms of the GNU Affero General Public License.
 * If you modify the source code and then use this modified source code in your creation, you must make available the source code of your modifications.
 *
 * You should have received a copy of the GNU Affero General Public License along with the software.
 * If not, please see : <http://www.gnu.org/licenses/>. Full compliance requires reading the terms of this license and following its directives.

 */

package org.entcore.common.http.filter;

import fr.wseduc.webutils.DefaultAsyncResult;
import fr.wseduc.webutils.security.SecureHttpServerRequest;
import fr.wseduc.webutils.security.oauth.DefaultOAuthResourceProvider;
import io.vertx.core.AsyncResult;
import io.vertx.core.Handler;
import io.vertx.core.eventbus.EventBus;
import io.vertx.core.json.JsonObject;
import org.entcore.common.cache.CacheService;
import org.entcore.common.events.EventStore;
import org.entcore.common.events.EventStoreFactory;
import org.entcore.common.user.UserInfos;
import org.entcore.common.utils.StringUtils;

import java.util.Base64;
import java.util.HashMap;
import java.util.Map;
import java.util.Optional;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

import static fr.wseduc.webutils.Utils.isNotEmpty;
import static org.entcore.common.aggregation.MongoConstants.TRACE_TYPE_OAUTH;

public class AppOAuthResourceProvider extends DefaultOAuthResourceProvider {

	private final Pattern prefixPattern;
	private final EventStore eventStore;
	private final Optional<CacheService> cacheService;
	private static int DEFAULT_TTL_SECONDS = 10 * 60;
	private final Integer ttl;

	public AppOAuthResourceProvider(EventBus eb, String prefix, Optional<CacheService> aCacheService, Optional<Integer> aTtl) {
		super(eb);
		final String p = prefix.isEmpty() ? "portal" : prefix.substring(1);
		prefixPattern = Pattern.compile("(^|\\s)" + p + "(\\s|$)");
		eventStore = EventStoreFactory.getFactory().getEventStore(p);
		cacheService = aCacheService;
		ttl = aTtl.isPresent()? aTtl.get() : DEFAULT_TTL_SECONDS;

	}

	private void cacheOAuthInfos(final String key, final SecureHttpServerRequest request, final JsonObject payload, final Handler<AsyncResult<JsonObject>> handler){
		super.getOAuthInfos(request, payload, resOauth -> {
			if(resOauth.succeeded()){
				cacheService.get().upsert(key, resOauth.result().encode(), this.ttl, resCache ->{});
				handler.handle(resOauth);
			}else{
				handler.handle(resOauth);
			}
		});
	}

	@Override
	protected void getOAuthInfos(final SecureHttpServerRequest request, final JsonObject payload, final Handler<AsyncResult<JsonObject>> handler){
		if(!cacheService.isPresent()){
			super.getOAuthInfos(request, payload, handler);
		} else {
			Optional<String> token = getTokenHeader(request);
			if(!token.isPresent()){
				token = getTokenParam(request);
			}
			if(token.isPresent()){
				final String key = "AppOAuthResourceProvider:" + token.get();
				cacheService.get().get(key, res->{
					if(res.succeeded() && res.result().isPresent()){
						try{
							final JsonObject cached = new JsonObject(res.result().get());
							handler.handle(new DefaultAsyncResult<>(cached));
						} catch (Exception e) {
							cacheOAuthInfos(key, request, payload, handler);
						}
					}else{
						cacheOAuthInfos(key, request, payload, handler);
					}
				});
			}else{
				super.getOAuthInfos(request, payload, handler);
			}
		}
	}

	@Override
	protected boolean customValidation(SecureHttpServerRequest request) {
		final String scope = request.getAttribute("scope");
		createStatsEvent(request);
		return isNotEmpty(scope) &&
				(prefixPattern.matcher(scope).find() ||
						request.path().contains("/auth/internal/userinfo") ||
						(scope.contains("userinfo") && request.path().contains("/auth/oauth2/userinfo")) ||
						("OAuthSystemUser".equals(request.getAttribute("remote_user")) && isNotEmpty(request.getAttribute("client_id"))) ||
						(scope.contains("myinfos") && request.path().contains("/directory/myinfos"))
				);
						//(scope.contains("openid") && request.path().contains())
	}

	private void createStatsEvent(SecureHttpServerRequest request) {
		UserInfos user = new UserInfos();
		user.setUserId(request.getAttribute("remote_user"));
		eventStore.createAndStoreEvent(TRACE_TYPE_OAUTH, user, new JsonObject()
				.put("path", request.path()).put("override-module", request.getAttribute("client_id")));
	}


	private static final Pattern REGEXP_AUTHORIZATION = Pattern.compile("^\\s*(OAuth|Bearer)\\s+([^\\s\\,]*)");

	private static Optional<String> getTokenHeader(SecureHttpServerRequest request) {
		//get from header
		final String header = request.getHeader("Authorization");
		if (header != null && Pattern.matches("^\\s*(OAuth|Bearer)(.*)$", header)) {
			final Matcher matcher = REGEXP_AUTHORIZATION.matcher(header);
			if (!matcher.find()) {
				return Optional.empty();
			} else {
				final String token = matcher.group(2);
				return Optional.ofNullable(token);
			}
		} else {
			return Optional.empty();
		}
	}

	private static Optional<String> getTokenParam(SecureHttpServerRequest request){
		final String oauthToken = request.params().get("oauth_token");
		final String accessToken = request.params().get("access_token");
		if (!StringUtils.isEmpty(accessToken)){
			return Optional.ofNullable(accessToken);
		} else if (!StringUtils.isEmpty(oauthToken)){
			return Optional.ofNullable(oauthToken);
		} else {
			return Optional.empty();
		}
	}

}
