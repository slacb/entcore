package org.entcore.common.cache;

import fr.wseduc.webutils.I18n;
import fr.wseduc.webutils.Utils;
import fr.wseduc.webutils.http.Binding;
import fr.wseduc.webutils.request.filter.Filter;
import io.vertx.core.Future;
import io.vertx.core.Handler;
import io.vertx.core.eventbus.EventBus;
import io.vertx.core.http.HttpServerRequest;
import io.vertx.core.json.DecodeException;
import io.vertx.core.json.JsonObject;
import io.vertx.core.logging.Logger;
import io.vertx.core.logging.LoggerFactory;
import org.entcore.common.http.filter.CsrfFilter;
import org.entcore.common.user.UserInfos;
import org.entcore.common.user.UserUtils;
import org.entcore.common.utils.StringUtils;

import java.io.BufferedReader;
import java.io.IOException;
import java.io.InputStream;
import java.io.InputStreamReader;
import java.util.*;
import java.util.regex.Matcher;

public class CacheFilter implements Filter {

    private static final Logger log = LoggerFactory.getLogger(CacheFilter.class);
    private final Set<Binding> bindings;
    private final CacheService cacheService;
    private final EventBus eb;
    private Map<String,JsonObject> cacheConfig;
    private final Set<Binding> cachedBindings=new HashSet<>();

    public CacheFilter(EventBus eb, Set<Binding> bindings, CacheService cacheService) {
        this.eb = eb;
        this.bindings = bindings;
        this.cacheService = cacheService;
    }

    private void loadCacheConfig() {
        cacheConfig = new HashMap<>();
        InputStream is = CsrfFilter.class.getClassLoader().getResourceAsStream(Cache.class.getSimpleName() + ".json");
        if (is != null) {
            BufferedReader r = null;
            try {
                r = new BufferedReader(new InputStreamReader(is, "UTF-8"));
                String line;
                while((line = r.readLine()) != null) {
                    final JsonObject cache = new JsonObject(line);
                    final String method = cache.getString("method", "");
                    if(!StringUtils.isEmpty(method)){
                        for (Binding binding : bindings) {
                            if (binding != null && method.equals(binding.getServiceMethod())) {
                                cachedBindings.add(binding);
                                cacheConfig.put(method, cache);
                                break;
                            }
                        }
                    }
                }
            } catch (IOException | DecodeException e) {
                log.error("Unable to load cacheCOnfig", e);
            } finally {
                if (r != null) {
                    try {
                        r.close();
                    } catch (IOException e) {
                        log.error("Close inputstream error", e);
                    }
                }
            }
        }
    }

    private Binding requestBinding(HttpServerRequest request) {
        for (Binding binding: cachedBindings) {
            if (!request.method().name().equals(binding.getMethod().name())) {
                continue;
            }
            Matcher m = binding.getUriPattern().matcher(request.path());
            if (m.matches()) {
                return binding;
            }
        }
        return null;
    }

    private void cache(final Binding binding, final HttpServerRequest request, final Handler<Boolean> handler){
        final JsonObject config = cacheConfig.get(binding.getServiceMethod());
        final String originalKey = config.getString("key");
        final String scope = config.getString("scope");
        final Integer ttlMinutes = config.getInteger("ttl", -1);
        final Integer ttl = ttlMinutes * 60;
        final String operation = config.getString("operation");
        final CacheScope cacheScope = CacheScope.valueOf(scope);
        final boolean usePath = config.getBoolean("usePath", false);
        final String realKey = usePath? request.path() : originalKey;
        if (CacheOperation.CACHE.equals(operation)) {
            //=== get or create from cache
            final Future<Optional<String>> result = Future.future();
            switch(cacheScope){
                case GLOBAL:
                    cacheService.get(realKey, resCache -> {
                        if(resCache.succeeded()){
                            result.complete(resCache.result());
                        }else{
                            result.fail(resCache.cause());
                        }
                    });
                    break;
                case LANG:
                    UserUtils.getUserInfos(eb,request, resUser -> {
                        if(resUser == null){
                            result.fail("User not found");
                            return;
                        }
                        final String lang = Utils.getOrElse(I18n.acceptLanguage(request), "fr");
                        cacheService.getForLang(lang, realKey, resCache ->{
                            if(resCache.succeeded()){
                                result.complete(resCache.result());
                            }else{
                                result.fail(resCache.cause());
                            }
                        });
                    });
                    break;
                case USER:
                    UserUtils.getUserInfos(eb,request, resUser -> {
                        if(resUser == null){
                            result.fail("User not found");
                            return;
                        }
                        cacheService.getForUser(resUser, realKey, resCache -> {
                            if(resCache.succeeded()){
                                result.complete(resCache.result());
                            }else{
                                result.fail(resCache.cause());
                            }
                        });
                    });
                    break;
            }
            //=== after get => send response if founded
            result.setHandler(res -> {
                if(res.succeeded() && res.result().isPresent()){
                    request.response().end(res.result().get());
                }else{
                    //=== continue and save response into cache
                    //TODO
                    handler.handle(true);
                }
            });
        } else {
            //=== invalidate cache
            switch(cacheScope){
                case GLOBAL:
                    cacheService.remove(realKey, resCache->{});
                    break;
                case LANG:
                    UserUtils.getUserInfos(eb,request, resUser -> {
                        if (resUser == null) { return; }
                        final String lang = Utils.getOrElse(I18n.acceptLanguage(request), "fr");
                        cacheService.removeForLang(lang, realKey, resCache -> { });
                    });
                    break;
                case USER:
                    UserUtils.getUserInfos(eb,request, resUser -> {
                        if (resUser == null) { return; }
                        cacheService.removeForUser(resUser, realKey, resCache -> { });
                    });
                    break;
            }
            //=== then continue
            handler.handle(true);
        }
    }

    @Override
    public void canAccess(final HttpServerRequest request, final Handler<Boolean> handler) {
        if (cacheConfig == null) {
            loadCacheConfig();
        }
        final Binding binding = requestBinding(request);
        if (binding !=null && cacheConfig.containsKey(binding.getServiceMethod())) {
            cache(binding, request, handler);
        } else {
            handler.handle(true);
        }
    }

    @Override
    public void deny(HttpServerRequest httpServerRequest) {}
}
