import express from "express"
import { PrismaClient } from '@prisma/client'

const app = express();

app.use(express.json());

const client = new PrismaClient();


app.get("/health", (req,res) => {
        res.json({
                msg : "server is running"
        })
});

app.post("/identify" , async (req,res) => {
	const { email , phoneNumber } = req.body;

	if(!email && !phoneNumber){
		res.status(400).json({
			msg : "Please send email or phone number"
		});
		return;
	};

	try {
		const contacts = await client.contact.findMany({
			where : {
				OR : [
					email ? {email} : {},
					phoneNumber ? {phoneNumber} : {}
				].filter(condition => Object.keys(condition).length > 0)
			},
			orderBy : { createdAt : "asc" }
		});

		// CASE 1 => If no contacts found, create a new primary contact
		if (contacts.length === 0) {
			const newPrimaryContact = await client.contact.create({
				data : {email , phoneNumber , linkPrecedence : "primary"}			
			});
		
			return res.json({
				contact: {
					primaryContactId: newPrimaryContact.id,
					emails: [newPrimaryContact.email].filter(Boolean),
					phoneNumbers: [newPrimaryContact.phoneNumber].filter(Boolean),
					secondaryContactIds: [],
				},
			});
		}

		// Find primary contact or the oldest one
		let primaryContact = contacts.find(x => x.linkPrecedence === "primary");
		if (!primaryContact) {
			primaryContact = contacts[0];
		}

		// Check if PrimaryContact exist more than one 
		const primaryContacts = contacts.filter(x => x.linkPrecedence === "primary");
		if (primaryContacts.length > 1) {
			// Find the oldest primary contact
			const oldestPrimary = primaryContacts.reduce((oldest, current) => 
				oldest.createdAt < current.createdAt ? oldest : current
			);
			
			// Convert other primary contacts to secondary
			const otherPrimaries = primaryContacts.filter(x => x.id !== oldestPrimary.id);
			for (const contact of otherPrimaries) {
				await client.contact.update({
					where: { id: contact.id },
					data: { 
						linkPrecedence: "secondary",
						linkedId: oldestPrimary.id
					}
				});
			}
			
			primaryContact = oldestPrimary;
		}

		// Get all related contacts
		const allRelatedContact = await client.contact.findMany({
			where : {
				OR : [
					{ id : primaryContact.id },
					{ linkedId : primaryContact.id}
				]
			},
			orderBy : { createdAt : "asc" },
		});

		const existingEmails = allRelatedContact.map(x => x.email).filter(Boolean);
		const existingPhones = allRelatedContact.map(x => x.phoneNumber).filter(Boolean);

		const isNewEmail = email && !existingEmails.includes(email);
		const isNewPhone = phoneNumber && !existingPhones.includes(phoneNumber);

		// Create secondary contact if new information is provided
		if (isNewEmail || isNewPhone) {
			await client.contact.create({
				data : {
					email ,
					phoneNumber,
					linkPrecedence : "secondary",
					linkedId : primaryContact.id,
				}
			});
		}

		// Get final updated contacts
		const finalContacts = await client.contact.findMany({
			where : {
				OR : [
					{ id : primaryContact.id},
					{linkedId : primaryContact.id}
				],
			},
			orderBy : { createdAt : "asc" }
		});



		const emails = [...new Set(finalContacts.map(x => x.email).filter(Boolean))];
		const phoneNumbers = [...new Set(finalContacts.map(x => x.phoneNumber).filter(Boolean))];
		
		// Ensure primary contact's email and phone are first using unshift
		const primaryContactData = finalContacts.find(x => x.id === primaryContact.id);
		if (primaryContactData?.email) {
			emails.unshift(primaryContactData.email);
		}
		if (primaryContactData?.phoneNumber) {
			phoneNumbers.unshift(primaryContactData.phoneNumber);
		}
		
		// Remove duplicates while preserving order
		const uniqueEmails = [...new Set(emails)];
		const uniquePhones = [...new Set(phoneNumbers)];

		const secondaryContactIds = finalContacts
			.filter(x => x.linkPrecedence === "secondary")
			.map(x => x.id);

		res.json({
			contact : {
				primaryContactId : primaryContact.id,
				emails: uniqueEmails,
				phoneNumbers : uniquePhones,
				secondaryContactIds : secondaryContactIds,
			}
		});

	} catch (error) {
		console.error('Error in /identify:', error);
		res.status(500).json({
			msg: "Internal server error"
		});
	}
});



app.listen(3000,()=>{
	console.log("Server is running on the port 3000");
})