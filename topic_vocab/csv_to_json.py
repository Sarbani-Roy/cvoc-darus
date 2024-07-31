import pandas as pd

# Read the CSV file
csv_file = 'dfg-2024.csv'

# Read the CSV file with the specified delimiter
# Read the CSV file
try:
    df = pd.read_csv(csv_file)

    # Convert DataFrame to JSON
    json_data = df.to_json(orient='records', force_ascii=False, indent=4)

    # Save JSON to a file
    with open('dfg-2024_in_json.json', 'w', encoding='utf-8') as json_file:
        json_file.write(json_data)

    print("CSV has been converted to JSON successfully!")
except pd.errors.ParserError as e:
    print(f"ParserError: {e}")
except Exception as e:
    print(f"An error occurred: {e}")