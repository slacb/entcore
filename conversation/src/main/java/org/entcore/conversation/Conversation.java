/* Copyright © WebServices pour l'Éducation, 2014
 *
 * This file is part of ENT Core. ENT Core is a versatile ENT engine based on the JVM.
 *
 * This program is free software; you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as
 * published by the Free Software Foundation (version 3 of the License).
 *
 * For the sake of explanation, any module that communicate over native
 * Web protocols, such as HTTP, with ENT Core is outside the scope of this
 * license and could be license under its own terms. This is merely considered
 * normal use of ENT Core, and does not fall under the heading of "covered work".
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.
 *
 */

package org.entcore.conversation;

import org.entcore.common.appregistry.AppRegistryEventsHandler;
import org.entcore.common.http.BaseServer;
import org.entcore.conversation.controllers.ConversationController;
import org.entcore.conversation.service.impl.ConversationRepositoryEvents;
import org.entcore.conversation.service.impl.ConversationServiceManager;

public class Conversation extends BaseServer {

	public final static int DEFAULT_FOLDER_DEPTH = 3;

	@Override
	public void start() {
		super.start();
		addController(new ConversationController());

		setRepositoryEvents(new ConversationRepositoryEvents());

		new AppRegistryEventsHandler(vertx, new ConversationServiceManager(vertx,
				config.getString("app-name", Conversation.class.getSimpleName())));

	}

}
