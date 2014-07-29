# Google Cloud Node.js Client

Node idiomatic client for Google Cloud services. Work in progress... Watch the repo for notifications.

![Travis Build Status](https://travis-ci.org/GoogleCloudPlatform/gcloud-node.svg)

This client supports the following Google Cloud services:

* [Google Cloud Datastore](https://developers.google.com/datastore/) (externalised Megastore, also allows access to the collections of your existing AppEngine apps)
* [Google Cloud Storage](https://cloud.google.com/products/cloud-storage/)
* [Google Cloud Pub/Sub](https://developers.google.com/pubsub/)
* Planned but not yet started: [Google Compute Engine](https://developers.google.com/compute), and [Google BigQuery](https://developers.google.com/bigquery/)

## Quickstart

~~~~
npm install gcloud
~~~~

### On Google Compute Engine

If you are running this client on Google Compute Engine, you can skip to the developer's guide. We handle authorisation for you with no configuration.

### Elsewhere

If you are not running this client on Google Compute Engine, you need a Google Developers service account. To create a service account:

* Visit the [Google Developers Console](https://console.developers.google.com/project).
* Create a new project or click on an existing project.
* Enable billing if you haven't already.
* On the "APIs & auth" tab, click APIs section and turn on the following. You may need to enable billing in order to use these services.
	* Google Cloud Datastore API
	* Google Cloud Storage
	* Google Cloud Storage JSON API
    * Google Cloud Pub/Sub
* Once API access is enabled, switch back to "APIs & auth" section on the navigation panel and switch to "Credentials" page.
* Click on "Create new client ID" to create a new **service account**. Once the account is created, click on "Generate new JSON key" to download
your private key.

The downloaded file contains credentials you'll need for authorization.
* You'll the following for auth configuration:
	* Developers Console project's ID (e.g. bamboo-shift-455)
	* The path to the JSON key file.

## Developer's Guide

* [Google Cloud Datastore](#google-cloud-datastore)
	* [Configuration](#configuration)
	* [Entities and Keys](#entities-and-keys)
	* [Getting, Saving and Deleting Entities](#getting-saving-and-deleting-entities)
	* [Querying](#querying)
	* [Allocating IDs](#allocating-ids-id-generation)
	* [Transactions](#transactions)
* [Google Cloud Storage](#google-cloud-storage)
    * [Configuration](#configuration-1)
    * [Listing Files](#listing-files)
    * [Stat Files](#stat-files)
    * [Read file contents](#read-file-contents)
    * [Write file contents and metadata](#write-file-contents-and-metadata)
    * [Copy files](#copy-files)
    * [Remove files](#remove-files)
* [Google Cloud Pub/Sub](#google-cloud-pub-sub)
    * [Configuration](#configuration-2)
    * [Topics and Subscriptions](#topics-and-subscriptions)
    * [Publishing a message](#publishing-a-message)
    * [Listening for messages](#listening-for-messages)

### Google Cloud Datastore

Google Cloud Datastore is a NoSQL database with the
convenience of a traditional RDBMS in terms of strong
consistency guarantees and high availability. It's also known
as Megastore. Its performance characteristics are explained
in detail on [Megastore: Providing Scalable, Highly Available Storage for Interactive Services](http://www.cidrdb.org/cidr2011/Papers/CIDR11_Paper32.pdf).

#### Configuration

If you're running this client on Google Compute Engine, you need to construct a dataset with your Compute Engine enabled project's ID (e.g. bamboo-shift-454). Project ID is listed on the [Google Developers Console](https://console.developers.google.com/project).

~~~~ js
var gcloud = require('gcloud'),
    ds = new gcloud.datastore.Dataset({ projectId: YOUR_PROJECT_ID });
~~~~

Elsewhere, initiate with project ID, service account's email and private key downloaded from Developer's Console.

~~~~ js
var gcloud = require('gcloud'),
    ds = new gcloud.datastore.Dataset({
    	projectId: YOUR_PROJECT_ID,
    	keyFilename: '/path/to/the/key.json'
    });
~~~~

#### Entities and Keys

TODO

#### Getting, Saving and Deleting Entities

Get operations require a valid key to retrieve the key identified entity from Datastore. Skip to the "Querying" section if you'd like to learn more about querying against Datastore.

~~~~ js
ds.get(['Company', 123], function(err, key, obj) {

});
// alternatively, you can retrieve multiple entities at once.
ds.getAll([key1, key2, ...], function(err, keys, objs) {

});
~~~~

You can insert arbitrary objects by providing an incomplete key during saving. If the key is not incomplete, the existing entity is updated or inserted with the provided key.

To learn more about keys and incomplete keys, skip to the Keys section.

~~~~ js
ds.save(['Company', null], obj, function(err, key) {
	// First arg is an incomplete key for Company kind.
	// console.log(key) will output ['Company', 599900452312].
});
// alternatively, you can save multiple entities at once.
ds.saveAll([key1, key2, key3], [obj1, obj2, obj3], function(err, keys) {
	// if key1 was incomplete, keys[0] will return the generated key.
});
~~~~

Deletion requires the key of the entity to be deleted.

~~~~ js
ds.del(['Company', 599900452312], function(err) {

});
// alternatively, you can delete multiple entities of different
// kinds at once.
ds.delAll([
	['Company', 599900452312],
	['Company', 599900452315],
    ['Office', 'mtv'],
	['Company', 123, 'Employee', 'jbd']], function(err) {

});
~~~~

#### Querying

Datastore allows you to query entities by kind, filter them by property filters and sort them by a property name. Projection and pagination are
also supported.

~~~~ js
// retrieves 5 companies
var q = ds.createQuery('Company').limit(5);
ds.runQuery(q, function(err, keys, objs, nextQuery) {
    // nextQuery is not null if there are more results.
    if (nextQuery) {
        ds.runQuery(nextQuery, callback);
    }
});
~~~~

##### Filtering

Datastore allows querying on properties. Supported comparison operators are
`=`, `<`, `>`, `<=`, `>=`. Not equal and `IN` operators are currently not
supported.

~~~~ js
// lists all companies named Google and
// have less than 400 employees.
var q = ds.createQuery('Company')
    .filter('name =', 'Google')
    .filter('size <', 400);
~~~~

In order to filter by ancestors, use `hasAncestor` helper.

~~~ js
var q = ds.createQuery('Child').hasAncestor(['Parent', 123]);
~~~

##### Sorting

You can sort the results by a property name ascendingly or descendingly.

~~~~ js
// sorts by size ascendingly.
var q = ds.createQuery('Company').order('+size');

// sorts by size descendingly.
var q = ds.createQuery('Company').order('-size');
~~~~

##### Selection (or Projection)

You may prefer to retrieve only a few of the properties of the entities.

~~~~ js
// retrieves names and sizes of all companies.
var q = ds.createQuery('Company').select(['name', 'size']);
~~~~

##### Pagination

Pagination allows you to set an offset, limit and starting cursor to a query.

~~~~ js
var q = ds.createQuery('Company')
    .offset(100) // start from 101th result
    .limit(10)   // return only 10 results
    .start(cursorToken); // continue to retrieve results from the given cursor.
~~~~

#### Allocating IDs (ID generation)

You can generate IDs without creating entities. The following call will create
100 new IDs from the Company kind which exists under the default namespace.

~~~~ js
ds.allocateIds(['Company', null], 100, function(err, keys) {

});
~~~~

You may prefer to create IDs from a non-default namespace by providing
an incomplete key with a namespace. Similar to the previous example, the
call below will create 100 new IDs, but from the Company kind that exists
under the "ns-test" namespace.

~~~~ js
ds.allocateIds(['ns-test', 'Company', null], 100, function(err, keys) {

});
~~~~

#### Transactions

Datastore has support for transactions. Transactions allow you to perform
multiple operations and commiting your changes atomically.

`runInTransaction` is a utility method to work with transactions.

~~~~ js
ds.runInTransaction(function(t, done) {
    // perform actions via t.
    t.get(key, function(err, obj) {
        if (err) {
            t.rollback(done);
            return;
        }
        // do any other operation with obj.
        // when you're done, call done.
        done();
    });
}, function(err) {
    // err exists if error during transaction
    // creation or auto-commit.
});
~~~~

The transaction will be auto committed if it's not rollbacked or
commited when done is called. Transactions support the following
CRUD and transaction related operations.

* t.get(key, callback)
* t.getAll(keys, callback)
* t.save(key, obj, callback)
* t.saveAll(keys, objs, callback)
* t.del(key, callback)
* t.delAll(keys, callback)
* t.rollback(callback)
* t.commit(callback)

### Google Cloud Storage

Google Cloud Storage allows you to store data on Google infrastructure. Read [Google Cloud Storage API docs](https://developers.google.com/storage/) for more information.

You need to create a Google Cloud Storage bucket to use this client library. Follow the steps on [Google Cloud Storage docs](https://developers.google.com/storage/) to create a bucket.

#### Configuration

If you're running this client on Google Compute Engine, you need to initiate a bucket object with your bucket's name.

~~~~ js
var gcloud = require('gcloud'),
    bucket = new gcloud.storage.Bucket({ bucketName: YOUR_BUCKET_NAME });
~~~~

Elsewhere, initiate with bucket's name, service account's email and private key downloaded from Developer's Console.

~~~~ js
var gcloud = require('gcloud'),
    bucket = new gcloud.storage.Bucket({
        projectId: YOUR_PROJECT_ID,
        keyFilename: '/path/to/the/key.json'
    });
~~~~

#### Listing Files

~~~~ js
bucket.list(function(err, files, nextQuery) {
    // if more results, nextQuery will be non-null.
});
~~~~

Or optionally, you can provide a query. The following call will limit the
number of results to 5.

~~~~ js
bucket.list({ maxResults: 5 }, function(err, files, nextQuery) {
    // if more results, nextQuery will be non-null.
});
~~~~

#### Stat Files

You can retrieve file metadata by stating the file.

~~~~ js
bucket.stat(filename, function(err, metadata) {
});
~~~~

#### Read file contents

Buckets provive a read stream to the file contents. You can pipe it to a write
stream, or listening 'data' events to read a file's contents. The following
example will create a readable stream to the file identified by filename,
and write the file contents to `/path/to/file`.

~~~~ js
bucket.createReadStream(filename)
    .pipe(fs.createWriteStream('/path/to/file'))
    .on('error', console.log)
    .on('completed', console.log);
~~~~

#### Write file contents and metadata

A bucket object allows you to write a readable stream, a file and a buffer
as file contents.

~~~~ js
// Uploads file.pdf
bucket.writeFile(
    filename, '/path/to/file.pdf', { contentType: 'application/pdf' }, callback);

// Reads the stream and uploads it as file contents
bucket.writeStream(
    filename, fs.createReadStream('/path/to/file.pdf'), metadata, callback);

// Uploads 'Hello World' as file contents
bucket.writeBuffer(filename, 'Hello World', callback);
~~~~

#### Copy files

You can copy an existing file. If no bucket name provided for the destination
file, current bucket name will be used.

~~~~ js
bucket.copy(filename, { bucket: 'other-bucket', name: 'other-filename' }, callback);
~~~~

#### Remove files

~~~~ js
bucket.remove(filename, callback);
~~~~

### Google Cloud Pub/Sub

Google Cloud Pub/Sub is a reliable, many-to-many, asynchronous messaging
service from Google Cloud Platform. A detailed overview is available on
[Pub/Sub docs](https://developers.google.com/pubsub/overview).

#### Configuration

If you're running this client on Google Compute Engine, you need to construct
a pubsub Connection with your Google Developers Console project ID.

~~~~ js
var gcloud = require('gcloud'),
    conn = new gcloud.pubsub.Connection({ projectId: YOUR_PROJECT_ID });
~~~~

Elsewhere, construct with project ID, service account's email
and private key downloaded from Developer's Console.

~~~~ js
var gcloud = require('gcloud'),
    conn = new gcloud.pubsub.Connection({
        projectId: YOUR_PROJECT_ID,
        email: 'xxx@developer.gserviceaccount.com',
        pemFilePath: '/path/to/the/pem/private/key.pem'
    });
~~~~

#### Topics and Subscriptions

List, get, create and delete topics.

~~~ js
// lists topics.
conn.listTopics({ maxResults: 5 }, function(err, topics, nextQuery) {
    // if more results, nextQuery will be non-null.
});

// retrieves an existing topic by name.
conn.getTopic('topic1', function(err, topic) {
    // deletes this topic.
    topic.del(callback);
});

// creates a new topic named topic2.
conn.createTopic('topic2', callback);
~~~

List, get, create and delete subscriptions.

~~~ js
var query = {
    maxResults: 5,
    filterByTopicName: 'topic1'
};
// list 5 subscriptions that are subscribed to topic1.
conn.listSubscriptions(query, function(err, subs, nextQuery) {
    // if there are more results, nextQuery will be non-null.
});

// get subscription named sub1
conn.getSubscription('sub1', function(err, sub) {
    // delete this subscription.
    sub.del(callback);
});

// create a new subsription named sub2, listens to topic1.
conn.createSubscription({
    topic: 'topic1',
    name: 'sub2',
    ackDeadlineSeconds: 60
}, callback);
~~~

#### Publishing a message

You need to retrieve or create a topic to publish a message.
You can either publish simple string messages or a raw Pub/Sub
message object.

~~~ js
conn.getTopic('topic1', function(err, topic) {
    // publishes "hello world" to to topic1 subscribers.
    topic.publish('hello world', callback);
    topic.publishMessage({
        data: 'Some text here...',
        label: [
            { key: 'priority', numValue: 0 },
            { key: 'foo', stringValue: 'bar' }
        ]
    }, callback);
});
~~~

#### Listening for messages

You can either pull messages one by one via a subscription, or
let the client to open a long-lived request to poll them.

~~~ js
// allow client to poll messages from sub1
// autoAck automatically acknowledges the messages. by default, false.
var sub = conn.subscribe('sub1', { autoAck: true });
sub.on('ready', function() {
    console.log('listening messages...');
});
sub.on('message', function(msg) {
    console.log('message retrieved:', msg);
});
sub.on('error', function(err) {
    console.log('error occured:', err);
});
sub.close(); // closes the connection, stops listening for messages.
~~~

## Contributing

See [CONTRIBUTING](CONTRIBUTING.md).
