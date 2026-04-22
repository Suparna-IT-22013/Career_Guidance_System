const API_URL = 'https://careerguidancesystem-production.up.railway.app/api';

// Check authentication
function checkAuth() {
    const token = localStorage.getItem('token');
    if (!token) {
        window.location.href = 'login.html';
        return null;
    }
    return token;
}

function getAuthHeaders() {
    const token = localStorage.getItem('token');
    return {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
    };
}

checkAuth();

let currentStep = 1;
const totalSteps = 10;

// All skills list
const allSkills = [
    // Programming Languages
    'python', 'javascript', 'java', 'cpp', 'csharp', 'php', 'swift', 'kotlin',
    // Web Development
    'htmlcss', 'react', 'vue', 'nodejs', 'expressjs', 'django', 'laravel', 'springboot',
    // Mobile Development
    'android', 'ios', 'flutter', 'reactnative',
    // Database & Backend
    'sql', 'postgresql', 'mongodb', 'redis', 'restapi', 'graphql',
    // AI/ML & Data Science
    'ml', 'dl', 'tensorflow', 'pytorch', 'dataanalysis', 'pandas', 'nlp', 'cv',
    // DevOps & Cloud
    'docker', 'kubernetes', 'aws', 'azure', 'cicd', 'linux', 'git',
    // Cybersecurity & Networking
    'netsec', 'ethicalhacking', 'pentest', 'firewall', 'tcpip', 'cisco',
    // Design & Soft Skills
    'uiux', 'figma', 'communication', 'problemsolving', 'leadership', 'teamwork', 'projectmgmt'
];

// Skill display names
const skillNames = {
    'python': 'Python',
    'javascript': 'JavaScript',
    'java': 'Java',
    'cpp': 'C++',
    'csharp': 'C#',
    'php': 'PHP',
    'swift': 'Swift',
    'kotlin': 'Kotlin',
    'htmlcss': 'HTML/CSS',
    'react': 'React',
    'vue': 'Vue.js',
    'nodejs': 'Node.js',
    'expressjs': 'Express.js',
    'django': 'Django',
    'laravel': 'Laravel',
    'springboot': 'Spring Boot',
    'android': 'Android Development',
    'ios': 'iOS Development',
    'flutter': 'Flutter',
    'reactnative': 'React Native',
    'sql': 'SQL/MySQL',
    'postgresql': 'PostgreSQL',
    'mongodb': 'MongoDB',
    'redis': 'Redis',
    'restapi': 'REST API',
    'graphql': 'GraphQL',
    'ml': 'Machine Learning',
    'dl': 'Deep Learning',
    'tensorflow': 'TensorFlow',
    'pytorch': 'PyTorch',
    'dataanalysis': 'Data Analysis',
    'pandas': 'Pandas/NumPy',
    'nlp': 'NLP',
    'cv': 'Computer Vision',
    'docker': 'Docker',
    'kubernetes': 'Kubernetes',
    'aws': 'AWS',
    'azure': 'Azure',
    'cicd': 'CI/CD',
    'linux': 'Linux/Unix',
    'git': 'Git/GitHub',
    'netsec': 'Network Security',
    'ethicalhacking': 'Ethical Hacking',
    'pentest': 'Penetration Testing',
    'firewall': 'Firewall/IDS/IPS',
    'tcpip': 'TCP/IP',
    'cisco': 'Cisco/Routing',
    'uiux': 'UI/UX Design',
    'figma': 'Figma/Adobe XD',
    'communication': 'Communication',
    'problemsolving': 'Problem Solving',
    'leadership': 'Leadership',
    'teamwork': 'Teamwork',
    'projectmgmt': 'Project Management'
};

// Update skill level labels
function updateSkillLevel(skill, value) {
    const level = value == 0 ? '0' : value < 25 ? 'Beginner' : value < 50 ? 'Intermediate' : value < 75 ? 'Advanced' : 'Expert';
    const levelElement = document.getElementById(skill + 'Level');
    if (levelElement) {
        levelElement.textContent = level;
    }
}

// Change step
function changeStep(direction) {
    const newStep = currentStep + direction;
    
    if (newStep < 1 || newStep > totalSteps) return;
    
    // Hide current step
    const currentStepElement = document.getElementById('step' + currentStep);
    if (currentStepElement) {
        currentStepElement.style.display = 'none';
    }
    
    // Show new step
    currentStep = newStep;
    const newStepElement = document.getElementById('step' + currentStep);
    if (newStepElement) {
        newStepElement.style.display = 'block';
    }
    
    // Update step indicator
    document.getElementById('currentStep').textContent = currentStep;
    
    // Update progress bar
    const progress = (currentStep / totalSteps) * 100;
    document.getElementById('progressBar').style.width = progress + '%';
    
    // Update buttons
    document.getElementById('prevBtn').style.display = currentStep === 1 ? 'none' : 'inline-block';
    document.getElementById('nextBtn').style.display = currentStep === totalSteps ? 'none' : 'inline-block';
    document.getElementById('submitBtn').style.display = currentStep === totalSteps ? 'inline-block' : 'none';
    
    // Add selected effect to checkboxes/radios
    updateSelectedOptions();
    
    // Scroll to top
    window.scrollTo(0, 0);
}

// Update selected option styles
function updateSelectedOptions() {
    document.querySelectorAll('.option-item').forEach(item => {
        const input = item.querySelector('input');
        if (input && input.checked) {
            item.classList.add('selected');
        } else {
            item.classList.remove('selected');
        }
    });
}

// Listen for checkbox/radio changes
document.addEventListener('change', (e) => {
    if (e.target.type === 'checkbox' || e.target.type === 'radio') {
        updateSelectedOptions();
    }
});

// Submit assessment
async function submitAssessment() {
    try {
        const interests = Array.from(document.querySelectorAll('input[name="interests"]:checked'))
            .map(cb => cb.value)
            .join(', ');
        
        const userSkills = [];
        
        allSkills.forEach(skillId => {
            const skillElement = document.getElementById(skillId + 'Skill');
            if (skillElement) {
                const level = parseInt(skillElement.value);
                if (level > 0) {
                    userSkills.push({
                        name: skillNames[skillId] || skillId,
                        level: level
                    });
                }
            }
        });
        
        const skillsString = userSkills
            .map(s => `${s.name.toLowerCase().replace(/\s+/g, '-').replace(/\//g, '-')}-${s.level}`)
            .join(', ');
        
        const education = document.querySelector('input[name="education"]:checked')?.value;
        const experience = document.getElementById('experience').value;
        const industry = document.getElementById('industry').value;

        if (!interests || !education) {
            alert('Please complete all required fields (at least select interests and education level)');
            return;
        }

        if (userSkills.length === 0) {
            alert('Please rate at least one skill before submitting');
            return;
        }

        const submitBtn = document.getElementById('submitBtn');
        submitBtn.textContent = 'Submitting...';
        submitBtn.disabled = true;

        // Step 1: Submit assessment
        const assessmentResponse = await fetch(`${API_URL}/career/assessment`, {
            method: 'POST',
            headers: getAuthHeaders(),
            body: JSON.stringify({
                interests,
                skills: skillsString,
                education_level: education,
                work_experience: parseInt(experience) || 0,
                preferred_industry: industry || ''
            })
        });

        const assessmentData = await assessmentResponse.json();

        if (!assessmentResponse.ok) {
            alert(assessmentData.message || 'Failed to submit assessment');
            submitBtn.textContent = 'Submit Assessment';
            submitBtn.disabled = false;
            return;
        }

        localStorage.setItem('lastAssessmentId', assessmentData.assessmentId);

        // Step 2: UPDATE skills instead of deleting
        // First, get existing skills
        const existingResponse = await fetch(`${API_URL}/skills/user`, {
            headers: getAuthHeaders()
        });
        
        const existingData = await existingResponse.json();
        const existingSkills = existingData.skills || [];

        // Step 3: Update or add skills
        for (const skill of userSkills) {
            const existingSkill = existingSkills.find(s => 
                s.skill_name.toLowerCase() === skill.name.toLowerCase()
            );

            if (existingSkill) {
                // Update existing skill
                await fetch(`${API_URL}/skills/update/${existingSkill.id}`, {
                    method: 'PUT',
                    headers: getAuthHeaders(),
                    body: JSON.stringify({
                        skill_level: skill.level
                    })
                });
            } else {
                // Add new skill
                await fetch(`${API_URL}/skills/add`, {
                    method: 'POST',
                    headers: getAuthHeaders(),
                    body: JSON.stringify({
                        skill_name: skill.name,
                        skill_level: skill.level
                    })
                });
            }
        }

        alert('Assessment submitted successfully! Your skills have been updated.');
        window.location.href = 'results.html';

    } catch (error) {
        alert('Error connecting to server. Please check your connection and try again.');
        console.error('Error:', error);
        const submitBtn = document.getElementById('submitBtn');
        submitBtn.textContent = 'Submit Assessment';
        submitBtn.disabled = false;
    }
}

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    // Set all skill levels to 0 initially
    allSkills.forEach(skill => {
        updateSkillLevel(skill, 0);
    });
});