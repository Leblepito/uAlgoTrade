# syntax=docker/dockerfile:1

FROM mcr.microsoft.com/dotnet/sdk:9.0 AS build
WORKDIR /src

# Copy solution and project files to leverage Docker cache
COPY ["FinancePlatform.sln", "."]
COPY ["src/FinancePlatform.API/FinancePlatform.API.csproj", "src/FinancePlatform.API/"]
COPY ["src/FinancePlatform.Application/FinancePlatform.Application.csproj", "src/FinancePlatform.Application/"]
COPY ["src/FinancePlatform.Domain/FinancePlatform.Domain.csproj", "src/FinancePlatform.Domain/"]
COPY ["src/FinancePlatform.Infrastructure/FinancePlatform.Infrastructure.csproj", "src/FinancePlatform.Infrastructure/"]

# Restore packages
RUN dotnet restore "FinancePlatform.sln"

# Copy the rest of the source code
COPY . .

# Build and Publish
WORKDIR "/src/src/FinancePlatform.API"
RUN dotnet build "FinancePlatform.API.csproj" -c Release -o /app/build
RUN dotnet publish "FinancePlatform.API.csproj" -c Release -o /app/publish /p:UseAppHost=false

# Final stage/image
FROM mcr.microsoft.com/dotnet/aspnet:9.0 AS final
WORKDIR /app
COPY --from=build /app/publish .
ENV ASPNETCORE_URLS=http://+:8080
EXPOSE 8080
ENTRYPOINT ["dotnet", "FinancePlatform.API.dll"]
