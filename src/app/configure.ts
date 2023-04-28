"use client";

import { Amplify, Logger } from "aws-amplify";

import config from "./aws-exports";

Logger.LOG_LEVEL = "INFO";

Amplify.configure(config);
