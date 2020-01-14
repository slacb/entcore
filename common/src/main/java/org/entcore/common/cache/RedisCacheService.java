package org.entcore.common.cache;

import fr.wseduc.webutils.DefaultAsyncResult;
import io.vertx.core.AsyncResult;
import io.vertx.core.Handler;
import io.vertx.core.json.JsonObject;
import io.vertx.redis.RedisClient;
import org.entcore.common.user.UserInfos;

import java.util.Optional;

public class RedisCacheService implements  CacheService {
    final String GLOBAL_KEY = "global:";
    final String USER_KEY = "user:";
    final String LANG_KEY = "global:";
    final RedisClient redis;

    public RedisCacheService(RedisClient redis){
        this.redis = redis;
    }

    private void doSet(String key,String value, Integer ttl, Handler<AsyncResult<Void>> handler){
        redis.set(key, value, res->{
            if(res.succeeded()){
                if(ttl != null && ttl > 0){
                    redis.expire(key,ttl, resTtl ->{
                        handler.handle(new DefaultAsyncResult<>(null));
                    });
                }else{
                    handler.handle(new DefaultAsyncResult<>(null));
                }
            }else{
                handler.handle(new DefaultAsyncResult<>(res.cause()));
            }
        });
    }

    public void upsert(String key, String value, Integer ttl, Handler<AsyncResult<Void>> handler){
        doSet(GLOBAL_KEY + key, value, ttl, handler);
    }

    public void upsertForUser(UserInfos user, String key, String value, Integer ttl, Handler<AsyncResult<Void>> handler){
        doSet(USER_KEY+user.getUserId(), value, ttl, handler);
    }

    public void upsertForLang(String lang, String key, String value, Integer ttl, Handler<AsyncResult<Void>> handler){
        doSet(LANG_KEY+lang, value, ttl, handler);
    }

    private void doRemove(String key, Handler<AsyncResult<Void>> handler){
        redis.del(key, res->{
            if(res.succeeded()){
                handler.handle(new DefaultAsyncResult<>(null));
            }else{
                handler.handle(new DefaultAsyncResult<>(res.cause()));
            }
        });
    }

    public void remove(String key, Handler<AsyncResult<Void>> handler){
        doRemove(GLOBAL_KEY + key, handler);
    }

    public void removeForUser(UserInfos user, String key, Handler<AsyncResult<Void>> handler){
        doRemove(USER_KEY+user.getUserId(), handler);
    }

    public void removeForLang(String lang, String key, Handler<AsyncResult<Void>> handler){
        doRemove(LANG_KEY+lang, handler);
    }

    private void doGet(String key, Handler<AsyncResult<Optional<String>>> handler){
        redis.get(key, ar -> {
            if (ar.succeeded()) {
                if(ar.result() != null && !ar.result().isEmpty()){
                    final String value = ar.result();
                    handler.handle(new DefaultAsyncResult<>(Optional.ofNullable(value)));
                }else{
                    handler.handle(new DefaultAsyncResult<>(Optional.empty()));
                }
            }else{
                handler.handle(new DefaultAsyncResult<>(ar.cause()));
            }
        });
    }
    public void get(String key, Handler<AsyncResult<Optional<String>>> handler){
        doGet(GLOBAL_KEY + key, handler);
    }

    public void getForUser(UserInfos user, String key, Handler<AsyncResult<Optional<String>>> handler){
        doGet(USER_KEY+user.getUserId(), handler);
    }

    public void getForLang(String lang, String key, Handler<AsyncResult<Optional<String>>> handler){
        doGet(LANG_KEY+lang, handler);
    }
}
