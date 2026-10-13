# Stage 1: build the JAR from source
FROM maven:3.9-eclipse-temurin-17 AS build
WORKDIR /build
# Resolve dependencies first so this layer is cached until pom.xml changes
COPY pom.xml .
RUN mvn -B -q dependency:go-offline
COPY src ./src
RUN mvn -B -q clean package -DskipTests

# Stage 2: runtime image with only the JRE and the built JAR
FROM eclipse-temurin:17-jre
WORKDIR /app
# Wildcard keeps this independent of the pom.xml version; `clean package` leaves exactly one JAR
COPY --from=build /build/target/*.jar app.jar
EXPOSE 8080
ENTRYPOINT ["java", "-jar", "app.jar"]
