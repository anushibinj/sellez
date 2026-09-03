package com.sellez.storage;

import com.google.auth.oauth2.GoogleCredentials;
import com.google.cloud.storage.Bucket;
import com.google.firebase.FirebaseApp;
import com.google.firebase.FirebaseOptions;
import com.google.firebase.cloud.StorageClient;
import com.sellez.config.SellezProperties;

import java.io.FileInputStream;
import java.io.IOException;
import java.util.UUID;

/** Writes files to a Firebase Storage bucket (Firebase's managed layer over Google Cloud Storage). */
public class FirebaseStorageBackend implements StorageBackend {
    private final Bucket bucket;
    private final String bucketName;

    public FirebaseStorageBackend(SellezProperties properties) throws IOException {
        SellezProperties.Storage.Firebase config = properties.getStorage().getFirebase();
        this.bucketName = config.getBucket();

        GoogleCredentials credentials = config.getCredentialsPath().isBlank()
                ? GoogleCredentials.getApplicationDefault()
                : GoogleCredentials.fromStream(new FileInputStream(config.getCredentialsPath()));
        FirebaseOptions options = FirebaseOptions.builder()
                .setCredentials(credentials)
                .setStorageBucket(bucketName)
                .build();
        if (FirebaseApp.getApps().isEmpty()) {
            FirebaseApp.initializeApp(options);
        }
        this.bucket = StorageClient.getInstance().bucket();
    }

    @Override
    public String write(byte[] content, String extension) {
        String key = UUID.randomUUID() + "." + extension;
        bucket.create(key, content, "image/" + extension);
        return key;
    }

    @Override
    public String publicUrl(String key) {
        if (key == null) {
            return null;
        }
        // Standard public-object URL form; the bucket/object must be publicly readable for this to load.
        return "https://storage.googleapis.com/" + bucketName + "/" + key;
    }
}
