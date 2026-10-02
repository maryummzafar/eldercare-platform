# Production image for the Eldercare API. Any container host can run it
# (Render, Railway, Fly.io, a VM); it listens on $PORT, defaulting to 8081.

# --- build ---------------------------------------------------------------
FROM maven:3.9-eclipse-temurin-21 AS build
WORKDIR /src

# Dependencies first, so editing code does not re-download the world.
COPY pom.xml .
RUN mvn -q -B dependency:go-offline

COPY src ./src
# Tests run in CI and locally against H2; skipping them here keeps deploys fast.
RUN mvn -q -B package -DskipTests

# --- run -----------------------------------------------------------------
FROM eclipse-temurin:21-jre
WORKDIR /app

# Never run the server as root inside the container.
RUN useradd --system --uid 10001 app
USER app

COPY --from=build /src/target/*.jar app.jar

# Size the heap from the container's memory limit rather than the host's.
ENV JAVA_TOOL_OPTIONS="-XX:MaxRAMPercentage=75"
EXPOSE 8081
ENTRYPOINT ["java", "-jar", "/app/app.jar"]
