from django.contrib.auth import get_user_model
import json
from .models import Quiz, Question, Category, SubCategory
from decouple import config
from google import genai

def get_admin_user():
    try:
        User = get_user_model()
        return User.objects.filter(is_superuser=True).first().pk
    except Exception as ex:
        return None


def create_quiz(category_name, category_description, subcategory_name, time_duration, response_text):
    start_index = response_text.find('[')
    end_index = response_text.rfind(']') + 1
    response_text = response_text[start_index:end_index].strip()

    if not response_text:
        print("ERROR: response_text is empty.")
        return

    try:
        data = json.loads(response_text)
    except json.JSONDecodeError as e:
        print(f"ERROR: JSON decoding failed: {e}")
        return

    category, _ = Category.objects.get_or_create(name=category_name, defaults={"description": category_description})
    subcategory, _ = SubCategory.objects.get_or_create(name=subcategory_name, category=category)

    quiz = Quiz.objects.create(
        title=f"{category} Quiz",
        description="This quiz was generated from a JSON input",
        category=category,
        subcategory=subcategory,
        time_duration=time_duration,
    )

    for entry in data:
        question_text = entry.get("question")
        options = entry.get("options")
        correct_answer = entry.get("correct_answer")
        difficulty = entry.get("difficulty", "Medium")

        if not question_text or not options or not correct_answer:
            continue

        option_a = options.get("A", "")
        option_b = options.get("B", "")
        option_c = options.get("C", "")
        option_d = options.get("D", "")

        if correct_answer not in options.keys():
            print(f"Skipping question due to unmatched correct answer: {question_text}")
            continue

        Question.objects.create(
            quiz=quiz,
            text=question_text,
            option_a=option_a,
            option_b=option_b,
            option_c=option_c,
            option_d=option_d,
            correct_answer=correct_answer,
            difficulty=difficulty
        )
        
    return quiz


def get_prompt(**kwargs):
    prompt = f"""
        You are a Quiz Generator AI. Based on the following input, generate a set of quiz questions ONLY in the exact JSON format described.

        ### Output format (strict):
        [
        {{
            "question": "string",
            "options": {{
                "A": "optionA",
                "B": "optionB",
                "C": "optionC",
                "D": "optionD"
            }},
            "correct_answer": "A",
            "difficulty": "Easy"
        }},
        ...
        ]

        ### Requirements:
        1. Each question must include:
        - "question": The question text (clear, concise, no ambiguity)
        - "options": Four answer choices mapped to keys "A", "B", "C", "D"
        - "correct_answer": The key of the correct answer ("A"/"B"/"C"/"D")
        - "difficulty": One of "Easy", "Medium", or "Hard"
        2. Do NOT repeat the same format or question wording.
        3. DO NOT include any explanations, headings, or extra text — ONLY output the JSON array.

        ### Input:
        Category: {kwargs.get('category', 'Science')}
        Subcategory: {kwargs.get('subcategory', 'Physics - Motion')}
        Number of Questions: {kwargs.get('num_questions', 10)}

        ### Output:
        Generate exactly {kwargs.get('num_questions', 10)} distinct questions in the above JSON format.
    """

    return prompt

API_KEY = config("API_KEY")
AI_MODEL = config("AI_MODEL")
client = genai.Client(api_key=API_KEY)

def generate_quiz(**kwargs):
    prompt = get_prompt(**kwargs)
    response = client.models.generate_content(
        model=AI_MODEL, contents=prompt
    )
    return response.text



