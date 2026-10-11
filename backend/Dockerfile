FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build
WORKDIR /src

COPY Turritopsis.sln .
COPY src/ src/
RUN dotnet restore src/Turritopsis.Api/Turritopsis.Api.csproj

COPY . .
RUN dotnet publish src/Turritopsis.Api/Turritopsis.Api.csproj -c Release -o /app --no-restore

FROM mcr.microsoft.com/dotnet/aspnet:8.0 AS runtime
WORKDIR /app
COPY --from=build /app .

ENV ASPNETCORE_ENVIRONMENT=Production
EXPOSE 8080
CMD ASPNETCORE_URLS=http://+:${PORT:-8080} dotnet Turritopsis.Api.dll
