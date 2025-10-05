import "dotenv/config";
import { mastra } from "../dist/mastra/index.js";

async function testNewsletterWorkflow() {
    console.log("🚀 Testing Newsletter Links Summarizer Workflow");

    // Test data with sample links
    const testInput = {
        links: [
            {
                link: "https://expressjs.com/2025/06/05/vulnerability-reporting-process-overhaul.html"
            },
            {
                link: "https://x.com/alistaiir/status/1926123966776635780"
            }
        ]
    };
    x
    try {
        // Get the workflow
        const workflow = mastra.getWorkflow("newsletterLinksSummarizerWorkflow");
        if (!workflow) {
            throw new Error("Newsletter Links Summarizer Workflow not found");
        }

        console.log("📋 Input links:");
        testInput.links.forEach((linkObj, index) => {
            console.log(`  ${index + 1}. ${linkObj.link}`);
        });

        // Create a run instance
        const run = await workflow.createRunAsync();

        console.log("\n⏳ Processing links...");

        // Start the workflow
        const result = await run.start({
            inputData: testInput
        });

        console.log("\n✅ Workflow completed!");
        console.log("📊 Status:", result.status);

        if (result.status === 'success') {
            console.log("\n📄 Generated Newsletter Content:");
            console.log("=".repeat(50));
            console.log(result.result);
            console.log("=".repeat(50));
        } else if (result.status === 'failed') {
            console.error("\n❌ Workflow failed:");
            console.error("Error:", result.error);
        } else if (result.status === 'suspended') {
            console.log("\n⏸️ Workflow suspended. Suspended steps:", result.suspended);
        }

        // Display step details for debugging
        console.log("\n🔍 Step Details:");
        Object.entries(result.steps).forEach(([stepId, stepResult]) => {
            console.log(`  - ${stepId}: ${stepResult.status}`);
            if (stepResult.status === 'failed' && stepResult.error) {
                console.log(`    Error: ${stepResult.error}`);
            }
        });

    } catch (error) {
        console.error("\n💥 Test failed with error:");
        console.error(error);
    }
}

// Run the test
testNewsletterWorkflow();