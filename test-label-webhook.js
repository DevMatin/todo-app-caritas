#!/usr/bin/env node

/**
 * Test script for cardLabelCreate webhook
 * This simulates the webhook calls you provided
 */

const testWebhook = async (labelName, labelColor) => {
  const webhookData = {
    event: "cardLabelCreate",
    data: {
      item: {
        id: `test-${Date.now()}`,
        createdAt: new Date().toISOString(),
        updatedAt: null,
        cardId: "1614531618771305515", // Same card ID as in your examples
        labelId: `label-${Date.now()}`
      },
      included: {
        projects: [
          {
            id: "1614518330226377735",
            createdAt: "2025-10-05T09:39:43.109Z",
            updatedAt: "2025-10-05T09:39:43.120Z",
            name: "Mozartstraße",
            description: "Geschäftsstelle",
            backgroundType: null,
            backgroundGradient: null,
            isHidden: false,
            ownerProjectManagerId: "1614518330259932168",
            backgroundImageId: null
          }
        ],
        boards: [
          {
            id: "1614518365206873097",
            createdAt: "2025-10-05T09:39:47.283Z",
            updatedAt: null,
            position: 65536,
            name: "EG",
            defaultView: "kanban",
            defaultCardType: "project",
            limitCardTypesToDefaultOne: false,
            alwaysDisplayCardCreator: false,
            projectId: "1614518330226377735"
          }
        ],
        labels: [
          {
            id: `label-${Date.now()}`,
            createdAt: new Date().toISOString(),
            updatedAt: null,
            position: 65536,
            name: labelName,
            color: labelColor,
            boardId: "1614518365206873097"
          }
        ],
        lists: [
          {
            id: "1614518997112325149",
            createdAt: "2025-10-05T09:41:02.608Z",
            updatedAt: null,
            type: "active",
            position: 131072,
            name: "Priorität 1",
            color: null,
            boardId: "1614518365206873097"
          }
        ],
        cards: [
          {
            id: "1614531618771305515",
            createdAt: "2025-10-05T10:06:07.228Z",
            updatedAt: new Date().toISOString(),
            type: "project",
            position: 65536,
            name: "Heizung Reparatur",
            description: "Heizung Tropft",
            dueDate: "2025-10-13T10:00:00.000Z",
            stopwatch: null,
            commentsTotal: 0,
            listChangedAt: new Date().toISOString(),
            boardId: "1614518365206873097",
            listId: "1614518997112325149",
            creatorUserId: "1614516758478062595",
            prevListId: null,
            coverAttachmentId: null
          }
        ]
      }
    },
    user: {
      id: "1614516758478062595",
      createdAt: "2025-10-05T09:36:35.741Z",
      updatedAt: "2025-10-05T09:39:17.441Z",
      email: "faal@caritas-erlangen.de",
      role: "admin",
      name: "Matin Faal",
      username: null,
      phone: null,
      organization: null,
      language: null,
      subscribeToOwnCards: false,
      subscribeToCardWhenCommenting: true,
      turnOffRecentCardHighlighting: false,
      enableFavoritesByDefault: false,
      defaultEditorMode: "wysiwyg",
      defaultHomeView: "groupedProjects",
      defaultProjectsOrder: "byDefault",
      isSsoUser: false,
      isDeactivated: false,
      avatar: null
    }
  }

  try {
    const response = await fetch('http://localhost:3000/api/webhooks/n8n', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Webhook-Token': 'caritas-webhook-token-2024'
      },
      body: JSON.stringify(webhookData)
    })

    const result = await response.json()
    console.log(`✅ ${labelName} Label Test:`, {
      status: response.status,
      label: result.card?.label,
      message: result.message
    })
    
    return result
  } catch (error) {
    console.error(`❌ ${labelName} Label Test failed:`, error.message)
    return null
  }
}

async function runTests() {
  console.log('🧪 Testing cardLabelCreate webhook...\n')
  
  // Test all three label types
  await testWebhook('Dringend', 'berry-red')
  await new Promise(resolve => setTimeout(resolve, 1000)) // Wait 1 second
  
  await testWebhook('Mittel', 'egg-yellow')
  await new Promise(resolve => setTimeout(resolve, 1000)) // Wait 1 second
  
  await testWebhook('Offen', 'wet-moss')
  
  console.log('\n🎉 All tests completed!')
  console.log('\n📝 Check your application to see if the badges are now showing:')
  console.log('   - Dringend (red badge)')
  console.log('   - Mittel (yellow badge)')
  console.log('   - Offen (green badge)')
}

runTests().catch(console.error)
