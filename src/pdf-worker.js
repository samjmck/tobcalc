import { workerMessageEventListener } from "#lib";

self.onmessage = workerMessageEventListener;
