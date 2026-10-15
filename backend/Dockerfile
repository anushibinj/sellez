# Stage 1: build the JAR from source
FROM gradle:8.14-jdk17 AS build
WORKDIR /build
# Resolve dependencies first so this layer is cached until the Gradle build files change
COPY build.gradle settings.gradle ./
RUN gradle --no-daemon -q dependencies > /dev/null
COPY src ./src
RUN gradle --no-daemon -q clean bootJar -x test

# Stage 2: runtime image with only the JRE and the built JAR
FROM eclipse-temurin:17-jre
WORKDIR /app
# Wildcard keeps this independent of the project version; the plain `jar` task is disabled so build/libs holds exactly one JAR
COPY --from=build /build/build/libs/*.jar app.jar
EXPOSE 8080
ENTRYPOINT ["java", "-jar", "app.jar"]
