import { workerMessageEventListener } from "@samjmck/tobcalc-lib";

self.onmessage = workerMessageEventListener;