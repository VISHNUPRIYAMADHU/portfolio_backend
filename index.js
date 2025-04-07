const express = require('express');
const cors = require('cors');
const fs = require('fs');  // To read the JSON file
const app = express();
const port = 5000;

// Enable CORS
app.use(cors());

// Middleware to parse JSON
app.use(express.json());

// Load the JSON data containing skills
const skillsData = JSON.parse(fs.readFileSync('skills.json', 'utf8'));

// Calculate match score based on user responses
const calculateMatchScore = (responses) => {
  let score = 0;

  // Function to get score for a single option (for questions 1, 2, 4, and 5)
  const getOptionScore = (option) => {
    const optionLower = option.toLowerCase();
    // Check if the option matches primary skills
    if (skillsData.skills.primary.some(skill => skill.toLowerCase().includes(optionLower))) {
      return 10;  // 10 points for primary skill match
    }
    // Check if the option matches secondary skills
    else if (skillsData.skills.secondary.some(skill => skill.toLowerCase().includes(optionLower))) {
      return 5;  // 5 points for secondary skill match
    }
    return 0;  // No match
  };

  // Check for question 3 (Experience required) - Max score 20
  const experienceResponse = responses[2];  // Question 3 is at index 2
  if (experienceResponse.some(option =>
    ["0-2 years", "3-5 years", "6-9 years"].includes(option))) {
    score += 10;  // If the response is one of the allowed values, add 20 points
  }

  // Check for question 6 (AI/ML requirement) - Max score 20
  const aiMlResponse = responses[5];  // Question 6 is at index 5
  if (aiMlResponse.length > 0) {
    score += 10;  // No matter what the response is, add 20 points
  }
  let individualScores =0;

  // Loop through the other responses and calculate score for each option - Max score 60
  responses.forEach((response, index) => {
    // Skip question 3 and 6 as they have custom scoring logic
    if (index === 2 || index === 5) return;

    if (!response.includes('Something else')) {
      console.log("Found 'Something else' in the array");
      individualScores+=20
      return
  }
  var lengthOfNormalOptions = response.indexOf("Something else");
  if(lengthOfNormalOptions>0){
    individualScores+=10
  }


    let localScoreForSomethingElse=0
    
    response.forEach(option => {
      console.log(`option ${option}`);
      let typedSkills

      // If the option is "Something else", check the typed values
      if (option === "Something else") {
        
        const typedValues = response[response.indexOf(option) + 1];  // Get the values typed after "Something else"
        console.log(`typedValues length ${typedValues.length}`);
        console.log(`typedValues ${typedValues}`);


        // If there are typed values, split by commas and process each
        if (typedValues && typedValues.trim() !== "") {
           typedSkills = typedValues.split(',').map(skill => skill.trim());  // Split by comma and trim extra spaces
          console.log(`typedSkills ${typedSkills}`);

          typedSkills.forEach(typedSkill => {
            const typedLower = typedSkill.toLowerCase();
            const matchesPrimary = skillsData.skills.primary.some(skill => skill.toLowerCase().includes(typedLower));
            const matchesSecondary = skillsData.skills.secondary.some(skill => skill.toLowerCase().includes(typedLower));

            console.log(`typedLower ${typedLower}`);
            console.log(`matchesPrimary ${matchesPrimary}`);

            if (matchesPrimary) {
              localScoreForSomethingElse += 10; // Add 10 points for matching primary skill
            } else if (matchesSecondary) {
              localScoreForSomethingElse += 5;  // Add 5 points for matching secondary skill
            } else {
              localScoreForSomethingElse += 0;  // No match
            }
          });
        }
        individualScores+= localScoreForSomethingElse/typedSkills.length
      } 
     
    });

  

    // Calculate average score for this question's response
   
  });

  score += individualScores;

  // Total score is now between 0 and 100
  console.log(`Match Score: ${score}`);
  return score;
};

// POST endpoint to calculate the match score
app.post('/calculate-match', (req, res) => {
  const { responses } = req.body;
  console.log(`Received responses: ${JSON.stringify(responses)}`);

  // Validate that responses exist and have exactly 6 elements
  if (!responses || responses.length !== 6) {
    return res.status(400).send({ message: 'Invalid responses format. Expected 6 responses.' });
  }

  try {
    const score = calculateMatchScore(responses);
    res.status(200).send({ score });
  } catch (error) {
    console.log('Error calculating score:', error);
    res.status(500).send({ message: 'Server error calculating match score', error: error.message });
  }
});

// Start the server
app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});
