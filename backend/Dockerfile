FROM mcr.microsoft.com/dotnet/sdk:9.0 AS build
WORKDIR /src

# Copy solution and project files
COPY TripCore.sln .
COPY TripCore.Domain/TripCore.Domain.csproj TripCore.Domain/
COPY TripCore.Application/TripCore.Application.csproj TripCore.Application/
COPY TripCore.Infrastructure/TripCore.Infrastructure.csproj TripCore.Infrastructure/
COPY TripCore.Api/TripCore.Api.csproj TripCore.Api/

# Restore dependencies
RUN dotnet restore

# Copy everything and build
COPY . .
RUN dotnet publish TripCore.Api/TripCore.Api.csproj -c Release -o /app/publish

# Runtime image
FROM mcr.microsoft.com/dotnet/aspnet:9.0 AS final
WORKDIR /app
COPY --from=build /app/publish .

# Create data directory for document uploads
RUN mkdir -p /data/documents

ENV ASPNETCORE_URLS=http://+:5000
ENV ASPNETCORE_ENVIRONMENT=Production
EXPOSE 5000

ENTRYPOINT ["dotnet", "TripCore.Api.dll"]
