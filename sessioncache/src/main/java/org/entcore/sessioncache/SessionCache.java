/* Copyright © "Open Digital Education", 2014
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

 *
 */

package org.entcore.sessioncache;

import io.vertx.core.shareddata.LocalMap;
import io.vertx.core.Handler;
import io.vertx.core.eventbus.Message;
import io.vertx.core.impl.VertxInternal;
import io.vertx.core.json.JsonObject;
import io.vertx.core.spi.cluster.ClusterManager;
import org.vertx.java.busmods.BusModBase;


import java.util.Map;

import static fr.wseduc.webutils.Utils.getOrElse;

public class SessionCache extends BusModBase implements Handler<Message<JsonObject>> {

	private static final long LAST_ACTIVITY_DELAY = 30000l;
	private static final String INACTIVITY = "inactivity";
	private static final String SESSIONS = "sessions";
	protected Map<String, String> sessions;
	protected Map<String, Long> inactivity;

	public void start() {
		super.start();
		LocalMap<Object, Object> server = vertx.sharedData().getLocalMap("server");
		Boolean cluster = (Boolean) server.get("cluster");
		if (Boolean.TRUE.equals(cluster)) {
			ClusterManager cm = ((VertxInternal) vertx).getClusterManager();
			sessions = cm.getSyncMap(SESSIONS);
			if (getOrElse(config.getBoolean(INACTIVITY), false)) {
				inactivity = cm.getSyncMap(INACTIVITY);
				logger.info("inactivity ha map : "  + inactivity.getClass().getName());
			}
			logger.info("Initialize session cluster maps.");
		} else {
			sessions = vertx.sharedData().getLocalMap(SESSIONS);
			if (getOrElse(config.getBoolean(INACTIVITY), false)) {
				inactivity = vertx.sharedData().getLocalMap(INACTIVITY);
			}
			logger.info("Initialize session hash maps.");
		}
		final String address = getOptionalStringConfig("address", "session.cache");

		eb.localConsumer(address, this);
	}

	@Override
	public void handle(Message<JsonObject> message) {
		String action = message.body().getString("action");

		if (action == null) {
			sendError(message, "action must be specified");
			return;
		}

		switch (action) {
		case "find":
			doFind(message);
			break;
		default:
			sendError(message, "Invalid action: " + action);
		}
	}

	private JsonObject unmarshal(String s) {
		if (s != null) {
			return new JsonObject(s);
		}
		return null;
	}

	private void doFind(final Message<JsonObject> message) {
		final String sessionId = message.body().getString("sessionId");
		if (sessionId == null || sessionId.trim().isEmpty()) {
			sendError(message, "Invalid sessionId.");
			return;
		}

		JsonObject session = null;
		try {
			session = unmarshal(sessions.get(sessionId));
		} catch (Exception e) {
			logger.warn("Error in deserializing hazelcast session " + sessionId);
			try {
				sessions.remove(sessionId);
			} catch (Exception e1) {
				logger.warn("Error getting object after removing hazelcast session " + sessionId);
			}
		}

		if (session == null) {
			sendError(message, "Session cache not found.");
		} else {
			sendOK(message, new JsonObject().put("status", "ok").put("session", session));
			if (inactivity != null) {
				Long lastActivity = inactivity.get(sessionId);
				String userId = sessions.get(sessionId);
				if (userId != null && (lastActivity == null || (lastActivity + LAST_ACTIVITY_DELAY) < System.currentTimeMillis())) {
					inactivity.put(sessionId, System.currentTimeMillis());
				}
			}
		}
	}

}
