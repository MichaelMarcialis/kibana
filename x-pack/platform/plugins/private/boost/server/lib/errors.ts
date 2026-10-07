/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

/** A client error that routes return with its status code and message. */
export class BoostRequestError extends Error {
  constructor(public readonly statusCode: 400 | 404 | 409, message: string) {
    super(message);
  }
}
