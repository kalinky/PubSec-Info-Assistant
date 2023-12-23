# Troubleshooting tips

If you run into any issues deploying this accelerator to your Azure subscription, these tips may help you resolve them.

## Insufficient Quota

```InsufficientQuota - The specified capacity '240' of account deployment is bigger than available capacity '110' for UsageName 'Tokens Per Minute (thousands) - Text-Embedding-Ada-002```

Some subscriptions or regions may have quota limits that are below the default values set for this accelerator. I added additional config settings to add ability to specify custom quota limits for embeddings. Check out [Deploying IA Accelerator to Azure](deployment/deployment.md).


## Autoscale

```The autoscale setting that you provided does not belong to the same subscription as one of the metric resources.```

Initially I deployed the accelerator to my Pay-as-You-Go subscription and then switched to my MSDN subscription to use my free Azure credits, rather than pay for running this accelerator in a sanpit out of pocket. Somehow the deployment process "remembers" the first subscription you use and then continues to deploy some resources to that subscription, not the new one you specify in the .env. Use find & replace to find any instances of old subscription, replace with new one, re-authenticate and so on. Double check where the services are being deployed.