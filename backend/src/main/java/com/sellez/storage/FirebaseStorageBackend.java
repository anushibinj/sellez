package com.sellez.storage;

import com.google.auth.oauth2.GoogleCredentials;
import com.google.cloud.storage.Blob;
import com.google.cloud.storage.Bucket;
import com.google.firebase.FirebaseApp;
import com.google.firebase.FirebaseOptions;
import com.google.firebase.cloud.StorageClient;
import com.sellez.config.SellezProperties;

import java.io.FileInputStream;
import java.io.IOException;
import java.util.UUID;

/**
 * Writes files to a Firebase Storage bucket (Firebase's managed layer over Google Cloud Storage).
 *
 * <p>The bucket stays private: {@link MediaController} reads objects back through the Admin SDK
 * (authenticated with the same service-account credentials as writes) and serves the bytes itself,
 * so no object ever needs a public URL or a public-read ACL.
 */
public class FirebaseStorageBackend implements StorageBackend {
    private final Bucket bucket;

    public FirebaseStorageBackend(SellezProperties properties) throws IOException {
        SellezProperties.Storage.Firebase config = properties.getStorage().getFirebase();
        String bucketName = config.getBucket();

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
    public StoredFile read(String key) {
        Blob blob = bucket.get(key);
        if (blob == null || !blob.exists()) {
            return null;
        }
        return new StoredFile(blob.getContent(), blob.getContentType());
    }
}
