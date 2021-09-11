exports.transcribeAudio = functions.storage.object().onChange(event => {
  const object = event.data;
  const filePath = object.name;
  const fileName = filePath.split("/").pop();
  const fileBucket = object.bucket;
  const bucket = gcs.bucket(fileBucket);
  const tempFilePath = path.join(os.tmpdir(), fileName);

  // Exit if this is triggered on a file that is not an image.
  // Get the file name.
  //const fileName = path.basename(filePath);
  console.log(filePath + " name: " + fileName);
  // Exit if the image is already a thumbnail.
  if (!filePath.startsWith("ucl-flac-audio")) {
    console.log("Only flac-audio need to be converted");
    return true;
  }
  // Exit if this is a move or deletion event.
  if (object.resourceState === "not_exists") {
    console.log("This is a deletion event.");
    return true;
  }

  return Promise.resolve()
    .then(() => {
      const audioFilename = "gs://" + fileBucket + "/" + filePath;
      console.log(audioFilename);
      const request = {
        config: {
          encoding: "FLAC",
          languageCode: "fr-FR"
        },
        audio: {
          uri: audioFilename
        }
      };

      return speech
        .longRunningRecognize(request)
        .then(function(responses) {
          var operation = responses[0];
          console.log("Operation: ", operation);
          return operation.promise();
        })
        .then(function(responses) {
          resolve(responses[0]);
          console.log("Result: ", JSON.stringify(responses[0]));
        })
        .catch(function(err) {
          console.error("Failed to get transcript.", err);
          //    reject(err);
        });
    })
    .catch(err => {
      return Promise.reject(err);
    });
});
