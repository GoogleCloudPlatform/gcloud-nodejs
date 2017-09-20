/*
 * Copyright 2017, Google Inc. All rights reserved.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

/*!
 * @module dlp
 * @name DLP
 */

'use strict';

var common = require('@google-cloud/common');
var extend = require('extend');
var gapic = {
  v2beta1: require('./v2beta1')
};
var grpc = require('grpc');

const VERSION = require('../package.json').version;

/**
 * The [Data Loss Prevention (DLP) API](https://cloud.google.com/dlp) allows
 * clients to detect the presence of Personally Identifiable Information (PII)
 * and other privacy-sensitive data in user-supplied, unstructured data streams,
 * like text blocks or images.
 *
 * The service also includes methods for sensitive data redaction and scheduling
 * of data scans on Google Cloud Platform based data sets.
 *
 * The servicePath from options will set the host. If not set, the
 * `GOOGLE_CLOUD_DLP_ENDPOINT` environment variable is honored,
 * otherwise the actual API endpoint will be used.
 *
 * @param {object=} options - [Configuration object](#/docs).
 * @param {number=} options.port - The port on which to connect to
 *     the remote host.
 * @param {string=} options.servicePath - The domain name of the
 *     API remote host.
 */
function dlpV2beta1(options) {
  options = common.util.resolveGapicOptions(
    options,
    [ 'GOOGLE_CLOUD_DLP_ENDPOINT' ],
    gapic.v2beta1.SERVICE_ADDRESS,
    gapic.v2beta1.DEFAULT_SERVICE_PORT,
    grpc.credentials.createInsecure()
  );

  // Define the header options.
  options = extend({}, options, {
    libName: 'gccl',
    libVersion: VERSION
  });

  // Create the image annotator client with the provided options.
  var client = gapic.v2beta1(options).dlpServiceClient(options);
  return client;
}

module.exports = dlpV2beta1;
module.exports.v2beta1 = dlpV2beta1;